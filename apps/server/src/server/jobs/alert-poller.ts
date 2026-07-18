import { runCommand } from "@/lib/ssh/client";
import { notifyChannel } from "@/server/notify";
import { prisma } from "@/db/prisma";

import { HostBackoff, mapLimit, SWEEP_CONCURRENCY } from "./sweep";

const UNIT_RE = /^[a-zA-Z0-9@._-]+$/;

type Rule = Awaited<ReturnType<typeof loadRules>>[number];
type Sample = { cpuLoad: number; memUsedPct: number; diskUsedPct: number };

// Survives across ticks: a host whose service checks keep timing out is skipped.
const backoff = new HostBackoff();

function loadRules() {
  return prisma.alertRule.findMany({
    where: { enabled: true },
    include: { channel: true, server: true },
  });
}

/**
 * Latest metric sample per server for the metric (non-service) rules, in ONE
 * query. `distinct` + `orderBy desc` returns the newest row per serverId, so we
 * no longer run a findFirst per rule (the N+1 this replaces).
 */
async function latestSamples(rules: Rule[]): Promise<Map<string, Sample>> {
  const ids = [
    ...new Set(rules.filter((r) => r.metric !== "service").map((r) => r.serverId)),
  ];
  if (ids.length === 0) return new Map();
  const rows = await prisma.metricSample.findMany({
    where: { serverId: { in: ids } },
    orderBy: { createdAt: "desc" },
    distinct: ["serverId"],
  });
  return new Map(rows.map((r) => [r.serverId, r]));
}

// Evaluate a rule against live service state or the prefetched latest sample.
async function isBreached(
  rule: Rule,
  latest: Map<string, Sample>,
): Promise<boolean> {
  if (rule.metric === "service") {
    if (!rule.target || !UNIT_RE.test(rule.target)) return false;
    const { stdout } = await runCommand(
      rule.server,
      `systemctl is-active ${rule.target}`,
    );
    return stdout.trim() !== "active"; // breach when not active
  }
  const sample = latest.get(rule.serverId);
  if (!sample) return false;
  const value =
    rule.metric === "cpu"
      ? sample.cpuLoad
      : rule.metric === "mem"
        ? sample.memUsedPct
        : sample.diskUsedPct;
  return rule.op === "<" ? value < rule.threshold : value > rule.threshold;
}

// Fire on rising edge (not-firing → breach), resolve on falling edge. Bounded
// concurrency across rules; service checks on a down host back off so one dead
// host can't stall the whole poll.
export async function pollAlerts(): Promise<void> {
  const rules = await loadRules();
  const latest = await latestSamples(rules);
  backoff.nextTick();

  await mapLimit(rules, SWEEP_CONCURRENCY, async (rule) => {
    const usesSsh = rule.metric === "service";
    if (usesSsh && backoff.shouldSkip(rule.serverId)) return;
    try {
      const breached = await isBreached(rule, latest);
      if (usesSsh) backoff.onSuccess(rule.serverId);
      if (breached && !rule.firing) {
        await prisma.alertRule.update({
          where: { id: rule.id },
          data: { firing: true, lastNotifiedAt: new Date() },
        });
        if (rule.channel)
          await notifyChannel(rule.channel, {
            status: "alert",
            server: rule.server.name,
            metric: rule.metric,
            op: rule.op,
            threshold: rule.threshold,
            target: rule.target,
            text: `[OpenPanel] ALERT ${rule.server.name}: ${rule.metric} ${rule.op} ${rule.threshold}`,
          });
      } else if (!breached && rule.firing) {
        await prisma.alertRule.update({
          where: { id: rule.id },
          data: { firing: false },
        });
        if (rule.channel)
          await notifyChannel(rule.channel, {
            status: "resolved",
            server: rule.server.name,
            metric: rule.metric,
            text: `[OpenPanel] RESOLVED ${rule.server.name}: ${rule.metric}`,
          });
      }
    } catch {
      // unreachable host / transient — back off the SSH path, retry next tick
      if (usesSsh) backoff.onFailure(rule.serverId);
    }
  });
}
