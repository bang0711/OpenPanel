export const SITES_AVAILABLE = "/etc/nginx/sites-available";
export const SITES_ENABLED = "/etc/nginx/sites-enabled";

// Marker line that identifies a site as an OpenPanel-managed reverse proxy.
export const MARKER = "# openpanel-proxy";

// Every value below is interpolated into a shell command or nginx config —
// keep each pattern strict.
export const NAME_RE = /^[a-zA-Z0-9._-]+$/;
export const DOMAIN_RE = /^[a-zA-Z0-9.-]+$/;
export const HOST_RE = /^[a-zA-Z0-9.\-]+$/;

export function isValidName(name: string): boolean {
  return typeof name === "string" && NAME_RE.test(name);
}

export function isValidDomain(name: string): boolean {
  return typeof name === "string" && DOMAIN_RE.test(name);
}

export function isValidHost(host: string): boolean {
  return typeof host === "string" && HOST_RE.test(host);
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}
