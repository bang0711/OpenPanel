// Curated, read-only log sources + input validation (injection defense).
// Commands are built ONLY from these templates plus a validated integer/unit.

// systemd unit names: letters, digits, and @ . _ - only. No shell metachars.
export const UNIT_RE = /^[a-zA-Z0-9@._-]+$/;

export type LogSource = {
  key: string;
  label: string;
  cmd: (lines: number) => string;
};

export const LOG_SOURCES: LogSource[] = [
  { key: "syslog", label: "syslog", cmd: (n) => `tail -n ${n} /var/log/syslog` },
  { key: "auth", label: "auth", cmd: (n) => `tail -n ${n} /var/log/auth.log` },
  { key: "kernel", label: "kernel", cmd: (n) => `dmesg | tail -n ${n}` },
  { key: "journal", label: "journal", cmd: (n) => `journalctl -n ${n} --no-pager` },
  {
    key: "nginx-access",
    label: "nginx-access",
    cmd: (n) => `tail -n ${n} /var/log/nginx/access.log`,
  },
  {
    key: "nginx-error",
    label: "nginx-error",
    cmd: (n) => `tail -n ${n} /var/log/nginx/error.log`,
  },
];

// The "unit" source needs a validated unit name, so it is templated here.
export function unitCmd(unit: string, lines: number): string {
  return `journalctl -u ${unit} -n ${lines} --no-pager`;
}

// All allowlisted keys (fixed sources + the dynamic "unit" source).
export const SOURCE_KEYS: string[] = [...LOG_SOURCES.map((s) => s.key), "unit"];
