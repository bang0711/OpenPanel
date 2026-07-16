const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes < 0) return "0 B";
  // Clamp to the last unit: values are parsed from remote output, and a bad
  // parse past PB would otherwise render a literal "undefined" to the user.
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(decimals)} ${BYTE_UNITS[i]}`;
}

export function formatUptime(seconds: number): string {
  if (seconds <= 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || parts.length === 0) parts.push(`${m}m`);
  return parts.join(" ");
}
