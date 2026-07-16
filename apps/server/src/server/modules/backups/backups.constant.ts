// Backup source validation. Sources are interpolated into shell commands, so
// they are validated strictly: db names must be bare identifiers; file paths
// must be absolute with no traversal and no single-quote/newline that could
// break out of the single-quoted shell string the runner builds.

export const BACKUP_KINDS = ["files", "db"] as const;
export type BackupKind = (typeof BACKUP_KINDS)[number];

export const DB_IDENT_RE = /^[a-zA-Z0-9_]+$/;

export const MAX_DB_NAME = 64;
export const MAX_PATH = 4096; // PATH_MAX on Linux

export function isValidSource(kind: string, source: string): boolean {
  // `db` is interpolated UNQUOTED (`mysqldump ${source}`), so only bare
  // identifiers are allowed — this regex is the whole defense.
  if (kind === "db") {
    return source.length <= MAX_DB_NAME && DB_IDENT_RE.test(source);
  }
  // `files` is interpolated inside SINGLE QUOTES by buildBackupCommand. That
  // is what makes metacharacters inert, so rejecting `'` here is load-bearing:
  // it is the only thing preventing a break-out. Do not relax it, and do not
  // interpolate a files source unquoted anywhere. We deliberately do NOT block
  // `;`, `$`, spaces etc. — they are legal in filenames and inert once quoted.
  if (kind === "files") {
    return (
      source.length <= MAX_PATH &&
      source.startsWith("/") &&
      !source.includes("..") &&
      !source.includes("'") &&
      !source.includes("\n") &&
      !source.includes("\r") &&
      !source.includes("\0")
    );
  }
  return false;
}
