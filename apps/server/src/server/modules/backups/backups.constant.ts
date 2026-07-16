// Backup source validation. Sources are interpolated into shell commands, so
// they are validated strictly: db names must be bare identifiers; file paths
// must be absolute with no traversal and no single-quote/newline that could
// break out of the single-quoted shell string the runner builds.

export const BACKUP_KINDS = ["files", "db"] as const;
export type BackupKind = (typeof BACKUP_KINDS)[number];

export const DB_IDENT_RE = /^[a-zA-Z0-9_]+$/;

export function isValidSource(kind: string, source: string): boolean {
  if (kind === "db") return DB_IDENT_RE.test(source);
  if (kind === "files")
    return (
      source.startsWith("/") &&
      !source.includes("..") &&
      !source.includes("'") &&
      !source.includes("\n") &&
      !source.includes("\r")
    );
  return false;
}
