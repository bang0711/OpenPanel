import { runCommand, runPrivileged, type SshServer } from "@/lib/ssh/client";
import { normalizeRemotePath } from "@/server/modules/files/files.constant";

import {
  BACKUP_ENGINES,
  type BackupEngine,
  isValidDb,
} from "./db-backup.constant";

export type DbBackupEngines = { mysql: boolean; postgres: boolean };
export type DbBackupList = { dumps: string[] };
export type DbBackupResult = { ok: boolean; output: string };

export class DbBackupService {
  async detect(server: SshServer): Promise<DbBackupEngines> {
    const { stdout } = await runCommand(
      server,
      "command -v mysqldump >/dev/null 2>&1 && echo mysql; " +
        "command -v pg_dump >/dev/null 2>&1 && echo postgres",
    );
    const found = stdout.trim().split(/\s+/);
    return {
      mysql: found.includes("mysql"),
      postgres: found.includes("postgres"),
    };
  }

  async list(server: SshServer, dir: string): Promise<DbBackupList> {
    const safeDir = normalizeRemotePath(dir);
    // Dumps are written as root, so the dir may be root-owned — escalate the
    // listing so it's readable however the user connected.
    const { stdout } = await runPrivileged(
      server,
      `ls -1t ${safeDir}/*.sql 2>/dev/null`,
    );
    const dumps = stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((p) => p.slice(p.lastIndexOf("/") + 1));
    return { dumps };
  }

  async dump(
    server: SshServer,
    engine: BackupEngine,
    database: string,
    dir: string,
  ): Promise<DbBackupResult> {
    if (!BACKUP_ENGINES.includes(engine)) throw new Error("Invalid engine");
    if (!isValidDb(database)) throw new Error("Invalid database name");
    const safeDir = normalizeRemotePath(dir);

    // Timestamp comes from the remote `date` command, not user input, so the
    // filename is unique without interpolating anything untrusted.
    const dumper =
      engine === "mysql"
        ? `mysqldump ${database}`
        : `sudo -u postgres pg_dump ${database}`;
    const cmd =
      `mkdir -p ${safeDir} && ${dumper} > ` +
      `'${safeDir}/${database}-'$(date +%Y%m%d-%H%M%S)'.sql'`;

    const { stdout, stderr, code } = await runPrivileged(server, cmd);
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }
}

export const dbBackupService = new DbBackupService();
