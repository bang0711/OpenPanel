// DB backup engine allowlist + database-name validation (injection defense).

export const BACKUP_ENGINES = ["mysql", "postgres"] as const;
export type BackupEngine = (typeof BACKUP_ENGINES)[number];

// Database identifier: letters, digits, underscore only. No shell metacharacters.
export const DB_IDENT_RE = /^[a-zA-Z0-9_]+$/;

export function isValidDb(name: string): boolean {
  return DB_IDENT_RE.test(name) && name.length <= 64;
}

export const DEFAULT_DIR = "/var/backups/openpanel";
