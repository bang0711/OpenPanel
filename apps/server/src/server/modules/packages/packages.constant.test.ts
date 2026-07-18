import { describe, expect, it } from "bun:test";

import { DETECT_CMD, isValidPkgName, MANAGER_COMMANDS } from "./packages.constant";

// Package names/queries go straight into `apt-get install -y <name>` unquoted.
describe("isValidPkgName", () => {
  it("accepts real package names", () => {
    expect(isValidPkgName("nginx")).toBe(true);
    expect(isValidPkgName("g++")).toBe(true);
    expect(isValidPkgName("python3.11")).toBe(true);
    expect(isValidPkgName("redis-server")).toBe(true);
    expect(isValidPkgName("lib_foo")).toBe(true);
    expect(isValidPkgName("7zip")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "nginx; id",
      "nginx | id",
      "nginx & id",
      "nginx$(id)",
      "nginx`id`",
      "nginx > /etc/passwd",
      "nginx < x",
      "(id)",
      "nginx id",
      "'nginx'",
      '"nginx"',
      "nginx\\;id",
      "nginx\0",
      "$IFS",
      "*",
    ]) {
      expect(isValidPkgName(bad)).toBe(false);
    }
  });

  // A package name must not double as a path (`-y ../../etc`) or an option.
  it("rejects traversal and leading punctuation", () => {
    expect(isValidPkgName("../etc/passwd")).toBe(false);
    expect(isValidPkgName("/usr/bin/id")).toBe(false);
    expect(isValidPkgName("-y")).toBe(false);
    expect(isValidPkgName(".hidden")).toBe(false);
    expect(isValidPkgName("+foo")).toBe(false);
  });

  it("is anchored — no prefix, suffix, or embedded newline", () => {
    expect(isValidPkgName("nginx\nevil; id")).toBe(false);
    expect(isValidPkgName("evil; id\nnginx")).toBe(false);
    expect(isValidPkgName("nginx\n")).toBe(false);
    expect(isValidPkgName("\tnginx")).toBe(false);
    expect(isValidPkgName("nginx ")).toBe(false);
  });

  it("rejects empty and over-long names", () => {
    expect(isValidPkgName("")).toBe(false);
    expect(isValidPkgName("a".repeat(128))).toBe(true);
  });
});

// Regression: apt/dnf/apk mutations ran without sudo, so a non-root SSH user hit
// "Could not open lock file … Permission denied". Reads stay unprivileged.
describe("MANAGER_COMMANDS privilege", () => {
  it("escalates mutating ops with sudo", () => {
    for (const m of ["apt", "dnf", "apk"] as const) {
      expect(MANAGER_COMMANDS[m].install("nginx")).toContain("sudo ");
      expect(MANAGER_COMMANDS[m].remove("nginx")).toContain("sudo ");
      expect(MANAGER_COMMANDS[m].refresh).toContain("sudo ");
    }
  });

  it("leaves read-only ops unprivileged", () => {
    for (const m of ["apt", "dnf", "apk"] as const) {
      expect(MANAGER_COMMANDS[m].listInstalled).not.toContain("sudo");
      expect(MANAGER_COMMANDS[m].search("nginx")).not.toContain("sudo");
    }
    expect(isValidPkgName("a".repeat(129))).toBe(false);
  });
});

describe("MANAGER_COMMANDS", () => {
  it("covers exactly the three supported managers", () => {
    expect(Object.keys(MANAGER_COMMANDS).sort()).toEqual(["apk", "apt", "dnf"]);
  });

  it("builds the expected command for a validated name", () => {
    expect(MANAGER_COMMANDS.apt.install("nginx")).toBe(
      "sudo env DEBIAN_FRONTEND=noninteractive apt-get install -y nginx",
    );
    expect(MANAGER_COMMANDS.apt.remove("nginx")).toBe(
      "sudo env DEBIAN_FRONTEND=noninteractive apt-get remove -y nginx",
    );
    expect(MANAGER_COMMANDS.dnf.install("nginx")).toBe("sudo dnf install -y nginx");
    expect(MANAGER_COMMANDS.apk.install("nginx")).toBe("sudo apk add nginx");
    expect(MANAGER_COMMANDS.apt.search("nginx")).toBe("apt-cache search nginx 2>/dev/null");
  });

  // Builders do NOT quote or escape — this documents WHY isValidPkgName is the
  // only thing standing between a client string and the remote shell.
  it("interpolates verbatim, so validation must happen before these are called", () => {
    expect(MANAGER_COMMANDS.apt.install("x; id")).toContain("x; id");
  });

  it("keeps the non-templated commands fixed", () => {
    expect(MANAGER_COMMANDS.apt.refresh).toBe("sudo apt-get update");
    expect(MANAGER_COMMANDS.dnf.refresh).toBe("sudo dnf makecache");
    expect(MANAGER_COMMANDS.apk.refresh).toBe("sudo apk update");
  });
});

describe("DETECT_CMD", () => {
  // Detection is a fixed probe; it must never grow an interpolation point.
  it("is a static probe printing a normalized manager key", () => {
    expect(DETECT_CMD).toContain("command -v apt-get");
    expect(DETECT_CMD).toContain("echo apk");
    expect(DETECT_CMD).not.toContain("${");
  });
});
