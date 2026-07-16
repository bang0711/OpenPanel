import { describe, expect, it } from "bun:test";

import { LOG_SOURCES, SOURCE_KEYS, UNIT_RE, unitCmd } from "./logs.constant";

describe("UNIT_RE", () => {
  it("accepts real systemd unit names", () => {
    expect(UNIT_RE.test("nginx")).toBe(true);
    expect(UNIT_RE.test("nginx.service")).toBe(true);
    expect(UNIT_RE.test("getty@tty1.service")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "nginx; id",
      "nginx|id",
      "nginx&&id",
      "nginx$(id)",
      "nginx`id`",
      "nginx>/tmp/x",
      "nginx<x",
      "(id)",
      "nginx id",
      "nginx'",
      'nginx"',
      "nginx\0",
      "../etc/passwd",
    ]) {
      expect(UNIT_RE.test(bad)).toBe(false);
    }
  });

  // Anchoring matters most here: unitCmd interpolates the unit unquoted, so an
  // accepted "nginx\nid" would run `id` as a second command line.
  it("is anchored — no prefix, suffix, or embedded newline", () => {
    expect(UNIT_RE.test("nginx\nevil; id")).toBe(false);
    expect(UNIT_RE.test("evil; id\nnginx")).toBe(false);
    expect(UNIT_RE.test("nginx\n")).toBe(false);
    expect(UNIT_RE.test("")).toBe(false);
  });

  it("is stateless across calls", () => {
    expect(UNIT_RE.global).toBe(false);
    expect(UNIT_RE.test("nginx")).toBe(true);
    expect(UNIT_RE.test("nginx")).toBe(true);
  });
});

describe("unitCmd", () => {
  it("builds a journalctl command honouring the line count", () => {
    expect(unitCmd("nginx.service", 200)).toBe(
      "journalctl -u nginx.service -n 200 --no-pager",
    );
    expect(unitCmd("nginx", 1)).toBe("journalctl -u nginx -n 1 --no-pager");
  });

  // unitCmd itself does NOT validate — callers must gate on UNIT_RE first.
  // Documented so the coupling is not silently dropped.
  it("interpolates verbatim, so UNIT_RE must be checked by the caller", () => {
    expect(unitCmd("x; id", 10)).toContain("x; id");
  });
});

describe("LOG_SOURCES / SOURCE_KEYS", () => {
  it("exposes exactly the curated keys plus the dynamic unit source", () => {
    expect(LOG_SOURCES.map((s) => s.key)).toEqual([
      "syslog",
      "auth",
      "kernel",
      "journal",
      "nginx-access",
      "nginx-error",
    ]);
    expect(SOURCE_KEYS).toEqual([
      "syslog",
      "auth",
      "kernel",
      "journal",
      "nginx-access",
      "nginx-error",
      "unit",
    ]);
  });

  it("builds each fixed source command with the requested line count", () => {
    const byKey = (k: string) => LOG_SOURCES.find((s) => s.key === k)!;
    expect(byKey("syslog").cmd(100)).toBe("tail -n 100 /var/log/syslog");
    expect(byKey("auth").cmd(50)).toBe("tail -n 50 /var/log/auth.log");
    expect(byKey("kernel").cmd(25)).toBe("dmesg | tail -n 25");
    expect(byKey("journal").cmd(10)).toBe("journalctl -n 10 --no-pager");
    expect(byKey("nginx-access").cmd(5)).toBe("tail -n 5 /var/log/nginx/access.log");
    expect(byKey("nginx-error").cmd(5)).toBe("tail -n 5 /var/log/nginx/error.log");
  });

  // The only client-controlled part of a fixed source is the line count.
  it("keeps every fixed source path a literal", () => {
    for (const s of LOG_SOURCES) {
      expect(s.cmd(1)).not.toContain("$");
    }
  });

  // An attacker-supplied key must not resolve to any command — array lookup by
  // key is the allowlist, so a near-miss or a metachar payload finds nothing.
  it("cannot select a command with an invalid source key", () => {
    for (const bad of ["", "unit", "syslog ", "SYSLOG", "syslog; id", "../syslog", "__proto__"]) {
      expect(LOG_SOURCES.find((s) => s.key === bad)).toBeUndefined();
    }
    expect(SOURCE_KEYS.includes("syslog; id")).toBe(false);
    expect(SOURCE_KEYS.includes("units")).toBe(false);
  });
});
