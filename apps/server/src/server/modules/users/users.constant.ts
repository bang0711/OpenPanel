// System-user validation. The username is interpolated into `useradd`/`userdel`/
// `usermod` commands, so it is strictly regex-validated first; the login shell is
// only ever taken from a fixed allowlist.

export const USERNAME_RE = /^[a-z_][a-z0-9_-]{0,31}$/;

export const SHELLS = [
  "/bin/bash",
  "/bin/sh",
  "/usr/sbin/nologin",
  "/bin/false",
] as const;
export type Shell = (typeof SHELLS)[number];

export function isValidUsername(username: string): boolean {
  return USERNAME_RE.test(username);
}
