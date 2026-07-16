import { metricsService } from "@/server/modules/metrics/metrics.service";
import { prisma } from "@/db/prisma";

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // keep 7 days of samples

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
    } catch {
      // host unreachable this tick — skip
    }
  }
  await prisma.metricSample.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
  });
}
