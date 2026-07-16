import { describe, expect, it } from "bun:test";

import {
  isValidUnit,
  KILL_SIGNALS,
  SERVICE_ACTIONS,
} from "./services.constant";

// SERVICE_ACTIONS / KILL_SIGNALS are spliced straight into `systemctl <action>`
// and `kill -<signal>`, so membership is the whole guard.
describe("SERVICE_ACTIONS", () => {
  it("is exactly the systemd verbs we support", () => {
    expect([...SERVICE_ACTIONS]).toEqual([
      "start",
      "stop",
      "restart",
      "enable",
      "disable",
    ]);
  });

  it("rejects near-misses and payloads", () => {
    const has = (s: string) => (SERVICE_ACTIONS as readonly string[]).includes(s);
    for (const bad of [
      "START",
      "Restart",
      "restartx",
      "star",
      "mask",
      "start; id",
      "start ",
      " start",
      "start\nstop",
      "",
    ]) {
      expect(has(bad)).toBe(false);
    }
  });
});

describe("KILL_SIGNALS", () => {
  it("is exactly the signals we allow", () => {
    expect([...KILL_SIGNALS]).toEqual(["TERM", "KILL", "HUP"]);
  });

  it("rejects near-misses and payloads", () => {
    const has = (s: string) => (KILL_SIGNALS as readonly string[]).includes(s);
    for (const bad of [
      "term",
      "SIGKILL",
      "KILL9",
      "9",
      "KILL; id",
      "KILL\nHUP",
      "",
    ]) {
      expect(has(bad)).toBe(false);
    }
  });
});

describe("isValidUnit", () => {
  it("accepts real systemd unit names", () => {
    expect(isValidUnit("nginx.service")).toBe(true);
    expect(isValidUnit("sshd")).toBe(true);
    expect(isValidUnit("getty@tty1.service")).toBe(true);
    expect(isValidUnit("systemd-resolved.service")).toBe(true);
    expect(isValidUnit("dbus.socket")).toBe(true);
    expect(isValidUnit("run-user-1000.mount")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "nginx.service; id",
      "nginx|id",
      "nginx&",
      "nginx$(id)",
      "nginx`id`",
      "nginx>f",
      "nginx<f",
      "nginx(x)",
      "nginx 'x'",
      'nginx"x"',
      "nginx service",
      "../etc/passwd",
      "nginx/../x",
      "nginx*",
      "nginx\0",
      "nginx#x",
    ]) {
      expect(isValidUnit(bad)).toBe(false);
    }
  });

  // Anchoring: `systemctl restart "nginx\nevil"` would run a second command.
  it("is anchored at both ends", () => {
    expect(isValidUnit("nginx\nevil; id")).toBe(false);
    expect(isValidUnit("evil; id\nnginx.service")).toBe(false);
    expect(isValidUnit("nginx.service\n")).toBe(false);
  });

  it("enforces the 128-char cap and rejects empty", () => {
    expect(isValidUnit("a".repeat(128))).toBe(true);
    expect(isValidUnit("a".repeat(129))).toBe(false);
    expect(isValidUnit("")).toBe(false);
  });

  it("rejects non-ASCII", () => {
    expect(isValidUnit("nginx–x.service")).toBe(false);
    expect(isValidUnit("ngіnx.service")).toBe(false); // Cyrillic і
  });

  // Regression: UNIT_RE was `[A-Za-z0-9_.@:\\-]` — inside a character class
  // `\\` is a *literal backslash* (the author meant an escaped hyphen), so
  // backslashes reached an unquoted `systemctl <unit>`, where they escape the
  // following character or continue the line.
  it("rejects a backslash", () => {
    expect(isValidUnit("nginx\\x.service")).toBe(false);
    expect(isValidUnit("\\")).toBe(false);
  });

  it("still accepts the hyphen the class was meant to allow", () => {
    expect(isValidUnit("my-app.service")).toBe(true);
    expect(isValidUnit("systemd-journald.service")).toBe(true);
  });
});
