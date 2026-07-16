export const SITES_AVAILABLE = "/etc/nginx/sites-available";
export const SITES_ENABLED = "/etc/nginx/sites-enabled";

export const MAX_CONFIG_BYTES = 64 * 1024; // 64 KB nginx site config

// Site name is used both in shell paths and SFTP paths — keep it strict.
export const SITE_RE = /^[a-zA-Z0-9._-]+$/;

export function isValidSite(name: string): boolean {
  // `.` and `..` match SITE_RE but are directory references, not sites: they
  // reach `ln -sf .../sites-available/..` and `rm -f .../sites-enabled/..`.
  // No slash is allowed so they cannot escape /etc/nginx, but a name that
  // resolves to a directory has no business reaching a command builder.
  if (name === "." || name === "..") return false;
  return typeof name === "string" && name.length <= 128 && SITE_RE.test(name);
}
