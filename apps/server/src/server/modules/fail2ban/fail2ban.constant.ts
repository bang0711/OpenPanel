import { isIP } from "node:net";

export const JAIL_RE = /^[a-zA-Z0-9._-]+$/;

export function isValidJail(jail: string): boolean {
  return JAIL_RE.test(jail);
}

/**
 * IPv4 or IPv6. Uses the platform parser rather than a regex: the previous
 * pattern nested quantifiers over overlapping character sets
 * (`([0-9a-fA-F:]+:+)+`), which backtracks exponentially — ~40 colons pinned
 * the single-threaded API server for minutes. `isIP` is linear, and stricter:
 * it rejects `999.999.999.999`, which the old pattern accepted.
 */
export function isValidIp(ip: string): boolean {
  return isIP(ip) !== 0;
}
