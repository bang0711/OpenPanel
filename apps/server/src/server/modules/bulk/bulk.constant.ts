// Allowlist for cross-server bulk actions (injection defense).
// Each action maps to a FIXED command + the capability it requires. Nothing
// from the client is interpolated except a regex-validated systemd unit name.
import type { Action } from "@/server/access";

export const UNIT_RE = /^[a-zA-Z0-9@._-]+$/;

export function isValidUnit(name: string): boolean {
  return UNIT_RE.test(name) && name.length <= 128;
}

export const BULK_ACTIONS = {
  uptime: { level: "read", cmd: "uptime" },
  disk: {
    level: "read",
    cmd: "df -h --output=source,pcent,target -x tmpfs -x devtmpfs 2>/dev/null",
  },
  "update-packages": {
    // Bare — write/admin actions run through runPrivileged, which escalates.
    level: "write",
    cmd: "(command -v apt-get >/dev/null && apt-get update) || (command -v dnf >/dev/null && dnf check-update) || true",
  },
  // service-restart has no fixed command: it is built per-request from a
  // validated unit name (see bulk.service.ts).
  "service-restart": { level: "admin", cmd: null },
} as const satisfies Record<string, { level: Action; cmd: string | null }>;

export type BulkAction = keyof typeof BULK_ACTIONS;
