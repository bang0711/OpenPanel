import { metricsService } from "@/server/modules/metrics/metrics.service";
import { serversService } from "@/server/modules/servers/servers.service";
import { prisma } from "@/db/prisma";

import { isPruneDue, retentionCutoff } from "./retention";
import { HostBackoff, mapLimit, SWEEP_CONCURRENCY } from "./sweep";

let lastPrunedAt = 0;
// Survives across ticks so a down host is skipped for exponentially more sweeps.
const backoff = new HostBackoff();

// Poll every registered server once and store a compact metric sample. Bounded
// concurrency caps SSH load; a repeatedly-unreachable host is skipped so it
// stops adding a full connect timeout to every sweep. Samples are written in one
// batch at the end.
export async function sampleMetrics(): Promise<void> {
  const servers = await prisma.server.findMany();
  backoff.nextTick();

  const samples: {
    serverId: string;
    cpuLoad: number;
    memUsedPct: number;
    diskUsedPct: number;
  }[] = [];

  await mapLimit(servers, SWEEP_CONCURRENCY, async (server) => {
    if (backoff.shouldSkip(server.id)) return;
    try {
      const m = await metricsService.collect(server);
      backoff.onSuccess(server.id);
      const memUsedPct = m.memory.totalBytes
        ? (m.memory.usedBytes / m.memory.totalBytes) * 100
        : 0;
      const diskUsedPct = m.disks.reduce((max, d) => Math.max(max, d.usePct), 0);
      // push is atomic between awaits (single-threaded), so concurrent workers
      // appending here is safe.
      samples.push({
        serverId: server.id,
        cpuLoad: m.load[0],
        memUsedPct,
        diskUsedPct,
      });
      // Backfill the distro for servers registered before osId existed (and
      // for hosts that were reinstalled). Only while null, so it costs one
      // extra command once per server, not every tick.
      if (!server.osId) await serversService.detectOs(server);
    } catch {
      // host unreachable this tick — back off and skip
      backoff.onFailure(server.id);
    }
  });

  if (samples.length > 0) {
    await prisma.metricSample.createMany({ data: samples });
  }

  const now = Date.now();
  if (isPruneDue(now, lastPrunedAt)) {
    lastPrunedAt = now;
    await prisma.metricSample.deleteMany({
      where: { createdAt: { lt: retentionCutoff(now) } },
    });
  }
}
