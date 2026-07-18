export const AUTH_TYPES = ["password", "key"] as const;
export type AuthType = (typeof AUTH_TYPES)[number];

export const DEFAULT_SSH_PORT = 22;

/** Read the distro id/name for the server icon. Fixed command, no user input. */
export const OS_RELEASE_CMD = "cat /etc/os-release 2>/dev/null";

/**
 * `/etc/os-release` ID values we render a brand icon for. Anything else falls
 * back to a generic icon, so this is an allowlist rather than a lookup table:
 * the file is remote-controlled text and must never reach the UI unchecked.
 */
export const KNOWN_OS_IDS = [
  "debian",
  "ubuntu",
  "alpine",
  "fedora",
  "arch",
  "rocky",
  "almalinux",
  "centos",
  "rhel",
  "opensuse",
  "opensuse-leap",
  "opensuse-tumbleweed",
  "raspbian",
  "linuxmint",
  "pop",
] as const;

export type KnownOsId = (typeof KNOWN_OS_IDS)[number];

/**
 * Pure planner for a server edit. Given the incoming (already schema-validated)
 * body and the current row, decide which plain columns change, whether the
 * pinned host key must be dropped, and how to treat the credentials — without
 * touching crypto or the DB (the service applies encryption + the write).
 *
 * `resetPin`: when the host or port moves, the pinned fingerprint (and the
 * detected OS) belong to the OLD endpoint, so we clear them and force a fresh
 * TOFU pin on the next "Test connection". `error`: switching auth type
 * (password↔key) with no new secret is rejected — the stored secret is the
 * wrong kind for the new type.
 */
export function planServerUpdate(
  body: {
    name?: string;
    host?: string;
    port?: number;
    username?: string;
    authType?: string;
    secret?: string;
    passphrase?: string;
  },
  current: { host: string; port: number; authType: string },
): {
  fields: {
    name?: string;
    host?: string;
    port?: number;
    username?: string;
    authType?: string;
  };
  resetPin: boolean;
  setSecret: boolean;
  setPassphrase: "keep" | "set" | "clear";
  error: string | null;
} {
  const fields: {
    name?: string;
    host?: string;
    port?: number;
    username?: string;
    authType?: string;
  } = {};
  if (body.name !== undefined) fields.name = body.name;
  if (body.host !== undefined) fields.host = body.host;
  if (body.port !== undefined) fields.port = body.port;
  if (body.username !== undefined) fields.username = body.username;
  if (body.authType !== undefined) fields.authType = body.authType;

  const hostChanged = body.host !== undefined && body.host !== current.host;
  const portChanged = body.port !== undefined && body.port !== current.port;
  const resetPin = hostChanged || portChanged;

  const setSecret = !!body.secret;

  // Absent → keep; empty string → clear (drop the stored passphrase); value → set.
  const setPassphrase: "keep" | "set" | "clear" =
    body.passphrase === undefined
      ? "keep"
      : body.passphrase === ""
        ? "clear"
        : "set";

  const authTypeChanged =
    body.authType !== undefined && body.authType !== current.authType;
  const error =
    authTypeChanged && !setSecret
      ? "Changing the authentication type requires a new secret"
      : null;

  return { fields, resetPin, setSecret, setPassphrase, error };
}

function unquote(value: string) {
  return value.trim().replace(/^["']|["']$/g, "");
}

/**
 * Parse `ID` / `PRETTY_NAME` out of os-release. Returns `osId: null` for an
 * unrecognised distro; `osName` is capped and stripped of control characters
 * because it is attacker-controlled if the host is hostile.
 */
export function parseOsRelease(stdout: string): {
  osId: string | null;
  osName: string | null;
} {
  const fields = new Map<string, string>();
  for (const line of stdout.split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    fields.set(line.slice(0, eq).trim(), unquote(line.slice(eq + 1)));
  }

  const rawId = (fields.get("ID") ?? "").toLowerCase();
  const osId = (KNOWN_OS_IDS as readonly string[]).includes(rawId)
    ? rawId
    : null;

  const rawName = fields.get("PRETTY_NAME") ?? fields.get("NAME") ?? "";
  const osName = [...rawName]
    .filter((c) => c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127)
    .join("")
    .slice(0, 64);

  return { osId, osName: osName || null };
}
