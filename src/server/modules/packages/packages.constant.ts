// Package-manager abstraction + input validation (injection defense).

export type PkgManager = "apt" | "dnf" | "apk";

// Package/query names: no shell metacharacters.
const PKG_NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9+._-]*$/;

export function isValidPkgName(name: string): boolean {
  return PKG_NAME_RE.test(name) && name.length <= 128;
}

// Detect the available manager; prints its normalized key or nothing.
export const DETECT_CMD =
  "if command -v apt-get >/dev/null 2>&1; then echo apt; " +
  "elif command -v dnf >/dev/null 2>&1; then echo dnf; " +
  "elif command -v yum >/dev/null 2>&1; then echo dnf; " +
  "elif command -v apk >/dev/null 2>&1; then echo apk; fi";

export const MANAGER_COMMANDS: Record<
  PkgManager,
  {
    listInstalled: string;
    search: (q: string) => string;
    install: (name: string) => string;
    remove: (name: string) => string;
    refresh: string;
  }
> = {
  apt: {
    listInstalled:
      "dpkg-query -W -f='${binary:Package}\\t${Version}\\n' 2>/dev/null",
    search: (q) => `apt-cache search ${q} 2>/dev/null`,
    install: (n) => `DEBIAN_FRONTEND=noninteractive apt-get install -y ${n}`,
    remove: (n) => `DEBIAN_FRONTEND=noninteractive apt-get remove -y ${n}`,
    refresh: "apt-get update",
  },
  dnf: {
    listInstalled: "rpm -qa --qf '%{NAME}\\t%{VERSION}-%{RELEASE}\\n' 2>/dev/null",
    search: (q) => `dnf -q search ${q} 2>/dev/null`,
    install: (n) => `dnf install -y ${n}`,
    remove: (n) => `dnf remove -y ${n}`,
    refresh: "dnf makecache",
  },
  apk: {
    listInstalled: "apk info -v 2>/dev/null",
    search: (q) => `apk search -v ${q} 2>/dev/null`,
    install: (n) => `apk add ${n}`,
    remove: (n) => `apk del ${n}`,
    refresh: "apk update",
  },
};
