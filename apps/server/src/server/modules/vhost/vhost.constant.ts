export const SITES_AVAILABLE = "/etc/nginx/sites-available";
export const SITES_ENABLED = "/etc/nginx/sites-enabled";

export const MAX_CONFIG_BYTES = 64 * 1024; // 64 KB nginx site config

// Site name is used both in shell paths and SFTP paths — keep it strict.
export const SITE_RE = /^[a-zA-Z0-9._-]+$/;

export function isValidSite(name: string): boolean {
  return typeof name === "string" && SITE_RE.test(name);
}
