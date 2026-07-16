export const JAIL_RE = /^[a-zA-Z0-9._-]+$/;

// IPv4 or IPv6 (loose but sufficient — only ever fed to fail2ban after this gate).
const IP_RE =
  /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F:]+:+)+[0-9a-fA-F]*(\.\d{1,3}\.\d{1,3}\.\d{1,3})?$/;

export function isValidJail(jail: string): boolean {
  return JAIL_RE.test(jail);
}

export function isValidIp(ip: string): boolean {
  return IP_RE.test(ip);
}
