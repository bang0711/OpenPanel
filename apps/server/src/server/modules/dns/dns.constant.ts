export const ALLOWED_PREFIXES = ["/etc/bind", "/var/named"];

// Zone name is fed into `named-checkzone` — keep it strict.
export const ZONE_RE = /^[a-zA-Z0-9.\-]+$/;

/** True when `path` sits under an allowed BIND zone directory. */
export function isAllowedZonePath(path: string): boolean {
  return ALLOWED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );
}

export function isValidZoneName(name: string): boolean {
  return typeof name === "string" && ZONE_RE.test(name);
}
