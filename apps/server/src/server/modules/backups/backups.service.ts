import type { BackupJob } from "@/generated/prisma/client";

import { prisma } from "@/db/prisma";
import { runPrivileged, type SshServer } from "@/lib/ssh/client";
import { normalizeRemotePath } from "@/server/modules/files/files.constant";

import { isValidSource } from "./backups.constant";

type CreateInput = {
  kind: "files" | "db";
  source: string;
  target: string;
  intervalMins: number;
};

// Builds the exact command the backup-runner scheduler uses, re-validating
// source/target so a tampered DB row can't inject shell. Keep in sync with the
// runner.
function buildBackupCommand(job: {
  kind: string;
  source: string;
  target: string;
}): string {
  const target = normalizeRemotePath(job.target);
  if (target.includes("'")) throw new Error("Invalid target");
  if (!isValidSource(job.kind, job.source)) throw new Error("Invalid source");

  const ts = "$(date +%Y%m%d-%H%M%S)";
  if (job.kind === "db") {
    return `mkdir -p '${target}' && mysqldump ${job.source} > '${target}/${job.source}-'${ts}'.sql'`;
  }
  const rel = job.source.replace(/^\/+/, "");
  return `mkdir -p '${target}' && tar czf '${target}/backup-'${ts}'.tar.gz' -C / '${rel}'`;
}

export class BackupService {
  list(serverId: string): Promise<BackupJob[]> {
    return prisma.backupJob.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
    });
  }

  get(id: string): Promise<BackupJob | null> {
    return prisma.backupJob.findUnique({ where: { id } });
  }

  create(userId: string, serverId: string, body: CreateInput): Promise<BackupJob> {
    if (!isValidSource(body.kind, body.source))
      throw new Error("Invalid source");
    const target = normalizeRemotePath(body.target);
    if (target.includes("'")) throw new Error("Invalid target");
    return prisma.backupJob.create({
      data: {
        userId,
        serverId,
        kind: body.kind,
        source: body.source,
        target,
        intervalMins: body.intervalMins,
      },
    });
  }

  setEnabled(id: string, enabled: boolean): Promise<BackupJob> {
    return prisma.backupJob.update({ where: { id }, data: { enabled } });
  }

  remove(id: string): Promise<BackupJob> {
    return prisma.backupJob.delete({ where: { id } });
  }

  async runNow(
    server: SshServer,
    job: BackupJob,
  ): Promise<{ ok: boolean; output: string }> {
    const cmd = buildBackupCommand(job);
    const { stdout, stderr, code } = await runPrivileged(server, cmd);
    const ok = code === 0;
    await prisma.backupJob.update({
      where: { id: job.id },
      data: { lastRunAt: new Date(), lastStatus: ok ? "ok" : "failed" },
    });
    return { ok, output: (stdout + stderr).trim() };
  }
}

export const backupService = new BackupService();
