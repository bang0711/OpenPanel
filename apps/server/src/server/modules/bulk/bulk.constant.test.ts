import { describe, expect, it } from "bun:test";

import { BULK_ACTIONS, isValidUnit, UNIT_RE } from "./bulk.constant";

// The unit name is the ONLY client string interpolated into a bulk command.
describe("isValidUnit", () => {
  it("accepts real systemd unit names", () => {
    expect(isValidUnit("nginx")).toBe(true);
    expect(isValidUnit("nginx.service")).toBe(true);
    expect(isValidUnit("getty@tty1.service")).toBe(true);
    expect(isValidUnit("my_app-1.socket")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "nginx; id",
      "nginx|id",
      "nginx&id",
      "nginx$(id)",
      "nginx`id`",
      "nginx>out",
      "nginx<in",
      "nginx(1)",
      "nginx id",
      "nginx'",
      'nginx"',
      "nginx\\",
      "nginx\0",
      "$USER",
    ]) {
      expect(isValidUnit(bad)).toBe(false);
    }
  });

  // Anchoring: an unanchored regex would accept junk around a valid core, and
  // an `m`-flagged one would accept a second line carrying a command.
  it("is anchored — no prefix, suffix, or embedded newline", () => {
    expect(isValidUnit("nginx\nevil; id")).toBe(false);
    expect(isValidUnit("evil; id\nnginx")).toBe(false);
    expect(isValidUnit("nginx\n")).toBe(false);
    expect(isValidUnit("\nnginx")).toBe(false);
    expect(isValidUnit("nginx\r\nid")).toBe(false);
  });

  it("rejects empty and over-long names", () => {
    expect(isValidUnit("")).toBe(false);
    expect(isValidUnit("a".repeat(128))).toBe(true);
    expect(isValidUnit("a".repeat(129))).toBe(false);
  });

  it("exports the same regex it validates with", () => {
    expect(UNIT_RE.test("nginx.service")).toBe(true);
    expect(UNIT_RE.test("nginx; id")).toBe(false);
    // A stateful (`g`) regex would flip results between calls.
    expect(UNIT_RE.global).toBe(false);
  });
});

describe("BULK_ACTIONS", () => {
  it("exposes exactly the four allowlisted actions", () => {
    expect(Object.keys(BULK_ACTIONS).sort()).toEqual([
      "disk",
      "service-restart",
      "update-packages",
      "uptime",
    ]);
  });

  it("rejects a near-miss key", () => {
    const keys = Object.keys(BULK_ACTIONS);
    expect(keys.includes("uptime ")).toBe(false);
    expect(keys.includes("restart")).toBe(false);
    expect(keys.includes("update_packages")).toBe(false);
  });

  // Destructive/mutating actions must not be gated at "read".
  it("assigns the intended capability level per action", () => {
    expect(BULK_ACTIONS.uptime.level).toBe("read");
    expect(BULK_ACTIONS.disk.level).toBe("read");
    expect(BULK_ACTIONS["update-packages"].level).toBe("write");
    expect(BULK_ACTIONS["service-restart"].level).toBe("admin");
  });

  // Every fixed command must be a literal — no interpolation surface at all.
  it("stores fixed command strings, and null only for the templated action", () => {
    expect(BULK_ACTIONS.uptime.cmd).toBe("uptime");
    expect(BULK_ACTIONS["service-restart"].cmd).toBeNull();
    for (const [key, spec] of Object.entries(BULK_ACTIONS)) {
      if (key === "service-restart") continue;
      expect(typeof spec.cmd).toBe("string");
      expect(spec.cmd).not.toContain("${");
    }
  });
});
