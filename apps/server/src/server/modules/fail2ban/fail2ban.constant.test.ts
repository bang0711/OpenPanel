import { describe, expect, it } from "bun:test";

import { isValidIp, isValidJail, JAIL_RE } from "./fail2ban.constant";

// Both values reach `fail2ban-client` inside a shell command string, so the
// regex is the only thing standing between a request body and `sh -c`.
describe("isValidJail", () => {
  it("accepts real jail names", () => {
    expect(isValidJail("sshd")).toBe(true);
    expect(isValidJail("nginx-http-auth")).toBe(true);
    expect(isValidJail("postfix.sasl")).toBe(true);
    expect(isValidJail("recidive_2")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "sshd; id",
      "sshd|id",
      "sshd&id",
      "sshd$(id)",
      "sshd`id`",
      "sshd>out",
      "sshd<in",
      "sshd(x)",
      "sshd 'x'",
      'sshd"x"',
      "sshd x",
      "../etc/passwd",
      "ssh/d",
      "sshd\0",
    ]) {
      expect(isValidJail(bad)).toBe(false);
    }
  });

  // Anchoring: an unanchored regex would accept a valid prefix with junk glued
  // on, turning one jail name into a second shell command.
  it("is anchored at both ends", () => {
    expect(isValidJail("sshd\nevil; id")).toBe(false);
    expect(isValidJail("evil; id\nsshd")).toBe(false);
    expect(isValidJail("sshd\n")).toBe(false);
    expect(isValidJail("\nsshd")).toBe(false);
  });

  it("rejects the empty string", () => {
    expect(isValidJail("")).toBe(false);
  });

  it("rejects unicode lookalikes", () => {
    expect(isValidJail("sshd‐extra")).toBe(false); // non-ASCII hyphen
    expect(isValidJail("ssнd")).toBe(false); // Cyrillic н
  });

  // No length cap here, unlike the other modules' validators.
  it("has no length cap", () => {
    expect(isValidJail("a".repeat(5000))).toBe(true);
  });

  it("exports the regex used by the helper", () => {
    expect(JAIL_RE.test("sshd")).toBe(isValidJail("sshd"));
  });
});

describe("isValidIp", () => {
  it("accepts IPv4", () => {
    expect(isValidIp("1.2.3.4")).toBe(true);
    expect(isValidIp("192.168.0.1")).toBe(true);
    expect(isValidIp("255.255.255.255")).toBe(true);
  });

  it("accepts IPv6", () => {
    expect(isValidIp("2001:db8::1")).toBe(true);
    expect(isValidIp("::1")).toBe(true);
    expect(isValidIp("fe80::1ff:fe23:4567:890a")).toBe(true);
    expect(isValidIp("2001:0db8:0000:0000:0000:ff00:0042:8329")).toBe(true);
  });

  it("accepts IPv4-mapped IPv6", () => {
    expect(isValidIp("::ffff:192.168.0.1")).toBe(true);
  });

  it("rejects shell metacharacters and injection payloads", () => {
    for (const bad of [
      "1.2.3.4; id",
      "1.2.3.4 && id",
      "1.2.3.4|id",
      "$(id)",
      "`id`",
      "1.2.3.4\0",
      "1.2.3.4 -x",
      "; rm -rf /",
      "../../etc/passwd",
      "",
      "localhost",
    ]) {
      expect(isValidIp(bad)).toBe(false);
    }
  });

  // Anchoring is what stops a well-formed address from carrying a payload.
  it("is anchored at both ends", () => {
    expect(isValidIp("1.2.3.4\nevil; id")).toBe(false);
    expect(isValidIp("evil\n1.2.3.4")).toBe(false);
    expect(isValidIp("2001:db8::1\nid")).toBe(false);
    expect(isValidIp("1.2.3.4 ")).toBe(false);
  });

  // Regression: the old shape-check regex accepted these. The platform parser
  // does real range validation, so a bogus address is refused before it reaches
  // fail2ban rather than after.
  it("rejects out-of-range octets", () => {
    expect(isValidIp("999.999.999.999")).toBe(false);
    expect(isValidIp("1.2.3.256")).toBe(false);
    expect(isValidIp("0.0.0.0")).toBe(true); // valid, if unusual
  });

  it("rejects colon runs that are not addresses", () => {
    expect(isValidIp(":::")).toBe(false);
    expect(isValidIp("::")).toBe(true); // the unspecified address is real
  });

  // Regression: `([0-9a-fA-F:]+:+)+` nested quantifiers over overlapping sets,
  // backtracking exponentially — ~4x per two added colons, measured. Bun's API
  // server is single-threaded, so one authenticated request with a ~40-char
  // value pinned the whole panel for minutes. `isIP` is linear.
  it("stays linear on a long colon run (ReDoS regression)", () => {
    const time = (n: number) => {
      const t = Bun.nanoseconds();
      isValidIp(":".repeat(n) + "z");
      return Bun.nanoseconds() - t;
    };
    time(24); // warm up
    const t0 = Bun.nanoseconds();
    for (let i = 0; i < 100; i++) isValidIp(":".repeat(64) + "z");
    const elapsed = Bun.nanoseconds() - t0;
    // 100 rejections of a pathological 65-char input, comfortably under 50ms.
    // The old pattern needed minutes for one.
    expect(elapsed).toBeLessThan(50_000_000);
    expect(time(64)).toBeLessThan(1_000_000); // < 1ms for a single call
  });
});
