import { describe, expect, it } from "bun:test";

import { isValidTarget, METRICS, OPS } from "./alerts.constant";

describe("METRICS / OPS", () => {
  it("has exactly the allowlisted metrics and comparison ops", () => {
    expect([...METRICS]).toEqual(["cpu", "mem", "disk", "service"]);
    expect([...OPS]).toEqual([">", "<"]);
  });

  it("rejects near-misses", () => {
    const metrics: readonly string[] = METRICS;
    const ops: readonly string[] = OPS;
    expect(metrics.includes("memory")).toBe(false);
    expect(metrics.includes("CPU")).toBe(false);
    expect(metrics.includes("network")).toBe(false);
    expect(metrics.includes("cpu; id")).toBe(false);
    expect(ops.includes(">=")).toBe(false);
    expect(ops.includes("=")).toBe(false);
    expect(ops.includes("")).toBe(false);
  });
});

// A "service" alert target becomes a systemd unit in a remote command.
describe("isValidTarget", () => {
  it("accepts unit names / identifiers", () => {
    expect(isValidTarget("nginx")).toBe(true);
    expect(isValidTarget("nginx.service")).toBe(true);
    expect(isValidTarget("getty@tty1.service")).toBe(true);
    expect(isValidTarget("my_app-1")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "nginx; id",
      "nginx|id",
      "nginx&id",
      "nginx$(id)",
      "nginx`id`",
      "nginx>/tmp/x",
      "nginx<x",
      "(nginx)",
      "nginx id",
      "nginx'",
      'nginx"',
      "nginx\0",
      "$SHELL",
      "../etc/passwd",
      "/",
    ]) {
      expect(isValidTarget(bad)).toBe(false);
    }
  });

  it("is anchored — no prefix, suffix, or embedded newline", () => {
    expect(isValidTarget("nginx\nevil; id")).toBe(false);
    expect(isValidTarget("evil; id\nnginx")).toBe(false);
    expect(isValidTarget("nginx\n")).toBe(false);
    expect(isValidTarget("\nnginx")).toBe(false);
  });

  it("rejects the empty target", () => {
    expect(isValidTarget("")).toBe(false);
  });

  // Regression: had no cap, unlike every sibling validator — an unbounded
  // string stored and interpolated into a remote command.
  it("caps the length", () => {
    expect(isValidTarget("a".repeat(128))).toBe(true);
    expect(isValidTarget("a".repeat(129))).toBe(false);
    expect(isValidTarget("a".repeat(10_000))).toBe(false);
  });
});
