import { runCommand } from "@/lib/ssh/client";
import { notifyChannel } from "@/server/notify";
import { prisma } from "@/db/prisma";

const UNIT_RE = /^[a-zA-Z0-9@._-]+$/;

type Rule = Awaited<ReturnType<typeof loadRules>>[number];

function loadRules() {
  return prisma.alertRule.findMany({
    where: { enabled: true },
    include: { channel: true, server: true },
  });
}

// Evaluate a rule against the latest metric sample or live service state.
async function isBreached(rule: Rule): Promise<boolean> {
  if (rule.metric === "service") {
    if (!rule.target || !UNIT_RE.test(rule.target)) return false;
    const { stdout } = await runCommand(
      rule.server,
      `systemctl is-active ${rule.target}`,
    );
    return stdout.trim() !== "active"; // breach when not active
  }
  const sample = await prisma.metricSample.findFirst({
    where: { serverId: rule.serverId },
    orderBy: { createdAt: "desc" },
  });
  if (!sample) return false;
  const value =
    rule.metric === "cpu"
      ? sample.cpuLoad
      : rule.metric === "mem"
        ? sample.memUsedPct
        : sample.diskUsedPct;
  return rule.op === "<" ? value < rule.threshold : value > rule.threshold;
}

// Fire on rising edge (not-firing → breach), resolve on falling edge.
export async function pollAlerts(): Promise<void> {
  const rules = await loadRules();
  for (const rule of rules) {
    try {
      const breached = await isBreached(rule);
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
      // unreachable host / transient — retry next tick
    }
  }
}
