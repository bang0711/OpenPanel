import { runCommand } from "@/lib/ssh/client";
import { normalizeRemotePath } from "@/server/modules/files/files.constant";
import { prisma } from "@/db/prisma";

const DB_IDENT_RE = /^[a-zA-Z0-9_]+$/;

type Job = Awaited<ReturnType<typeof loadJobs>>[number];

function loadJobs() {
  return prisma.backupJob.findMany({
    where: { enabled: true },
    include: { server: true },
  });
}

// Build a validated backup command. Throws on invalid source/target so a bad
// job is recorded as errored rather than running anything unsafe.
function buildCommand(job: Job): string {
  const target = normalizeRemotePath(job.target); // absolute, traversal-checked
  if (job.kind === "db") {
    if (!DB_IDENT_RE.test(job.source)) throw new Error("Invalid database name");
    return `mkdir -p '${target}' && sudo mysqldump ${job.source} > '${target}/${job.source}-'$(date +%Y%m%d-%H%M%S)'.sql'`;
  }
  // files
  const source = normalizeRemotePath(job.source);
  return `mkdir -p '${target}' && tar czf '${target}/backup-'$(date +%Y%m%d-%H%M%S)'.tar.gz' -C / '${source.replace(/^\//, "")}'`;
}

export async function runBackups(): Promise<void> {
  const jobs = await loadJobs();
  const now = Date.now();
  for (const job of jobs) {
    const due =
      !job.lastRunAt ||
      now - job.lastRunAt.getTime() >= job.intervalMins * 60_000;
    if (!due) continue;
    try {
      const cmd = buildCommand(job);
      const { code, stdout, stderr } = await runCommand(job.server, cmd);
      await prisma.backupJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: new Date(),
          lastStatus: code === 0 ? "ok" : (stderr || stdout).slice(0, 200),
        },
      });
    } catch (err) {
      await prisma.backupJob
        .update({
          where: { id: job.id },
          data: {
            lastRunAt: new Date(),
            lastStatus: err instanceof Error ? err.message.slice(0, 200) : "error",
          },
        })
        .catch(() => {});
    }
  }
}
