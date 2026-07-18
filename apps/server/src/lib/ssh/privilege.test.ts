import { describe, expect, it } from "bun:test";

import { escalate, parseSudoMode, shSingleQuote } from "./privilege";

describe("shSingleQuote", () => {
  it("wraps a plain string", () => {
    expect(shSingleQuote("apt-get install -y nginx")).toBe(
      "'apt-get install -y nginx'",
    );
  });

  it("escapes embedded single quotes so the shell can't break out", () => {
    // The classic injection: a value containing a quote must not close ours.
    expect(shSingleQuote("a'; rm -rf / #")).toBe("'a'\\''; rm -rf / #'");
  });
});

describe("escalate", () => {
  const cmd = "apt-get install -y nginx";

  it("root (none): runs bare, no password", () => {
    const e = escalate(cmd, "none");
    expect(e.command).toBe("sh -c 'apt-get install -y nginx'");
    expect(e.needsPassword).toBe(false);
  });

  it("nopasswd: sudo -n, no password", () => {
    const e = escalate(cmd, "nopasswd");
    expect(e.command).toBe("sudo -n -- sh -c 'apt-get install -y nginx'");
    expect(e.needsPassword).toBe(false);
  });

  it("password: sudo -S, password fed on stdin", () => {
    const e = escalate(cmd, "password");
    expect(e.command).toBe("sudo -S -p '' -- sh -c 'apt-get install -y nginx'");
    expect(e.needsPassword).toBe(true);
  });

  it("unknown: runtime root check, falls back to passwordless sudo", () => {
    const e = escalate(cmd, "unknown");
    expect(e.command).toContain('[ "$(id -u)" = 0 ]');
    expect(e.command).toContain("sudo -n --");
    expect(e.needsPassword).toBe(false);
  });

  it("only 'password' mode ever asks for the password on stdin", () => {
    for (const m of ["none", "nopasswd", "unknown"] as const) {
      expect(escalate(cmd, m).needsPassword).toBe(false);
    }
    expect(escalate(cmd, "password").needsPassword).toBe(true);
  });

  it("an injection-laden command stays inside the single-quoted shell string", () => {
    const evil = "x'; reboot #";
    const e = escalate(evil, "nopasswd");
    // The quote is escaped, so `reboot` is an argument to sh -c, not a new command.
    expect(e.command).toBe("sudo -n -- sh -c 'x'\\''; reboot #'");
  });
});

describe("parseSudoMode", () => {
  it("accepts the three probe outputs", () => {
    expect(parseSudoMode("none\n")).toBe("none");
    expect(parseSudoMode(" nopasswd ")).toBe("nopasswd");
    expect(parseSudoMode("password")).toBe("password");
  });

  it("anything else is unknown", () => {
    expect(parseSudoMode("")).toBe("unknown");
    expect(parseSudoMode("garbage")).toBe("unknown");
  });
});
