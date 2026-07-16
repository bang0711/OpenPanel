import { metricsService } from "@/server/modules/metrics/metrics.service";
import { serversService } from "@/server/modules/servers/servers.service";
import { prisma } from "@/db/prisma";

import { isPruneDue, retentionCutoff } from "./retention";

let lastPrunedAt = 0;

// Poll every registered server once and store a compact metric sample.
// Sequential to bound concurrent SSH load; unreachable hosts are skipped.
export async function sampleMetrics(): Promise<void> {
  const servers = await prisma.server.findMany();
  for (const server of servers) {
    try {
      const m = await metricsService.collect(server);
      const memUsedPct = m.memory.totalBytes
        ? (m.memory.usedBytes / m.memory.totalBytes) * 100
        : 0;
      const diskUsedPct = m.disks.reduce((max, d) => Math.max(max, d.usePct), 0);
      await prisma.metricSample.create({
        data: {
          serverId: server.id,
          cpuLoad: m.load[0],
          memUsedPct,
          diskUsedPct,
        },
      });
      // Backfill the distro for servers registered before osId existed (and
      // for hosts that were reinstalled). Only while null, so it costs one
      // extra command once per server, not every tick.
      if (!server.osId) await serversService.detectOs(server);
    } catch {
      // host unreachable this tick — skip
    }
  }
  const now = Date.now();
  if (isPruneDue(now, lastPrunedAt)) {
    lastPrunedAt = now;
    await prisma.metricSample.deleteMany({
      where: { createdAt: { lt: retentionCutoff(now) } },
    });
  }
}
