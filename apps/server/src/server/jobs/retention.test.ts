import { describe, expect, it } from "bun:test";

import { isPruneDue, PRUNE_EVERY_MS, RETENTION_MS, retentionCutoff } from "./retention";

const HOUR = 60 * 60 * 1000;

// The sampler ticks every 60s. Pruning on every tick meant a DELETE against a
// ~500k-row table every minute to usually remove nothing.
describe("isPruneDue", () => {
  it("prunes on the first tick after boot (lastRun = 0)", () => {
    expect(isPruneDue(Date.parse("2026-01-01T00:00:00Z"), 0)).toBe(true);
  });

  it("does not prune again within the hour", () => {
    const last = 10 * HOUR;
    expect(isPruneDue(last + 60_000, last)).toBe(false); // the next 60s tick
    expect(isPruneDue(last + 59 * 60_000, last)).toBe(false);
  });

  it("prunes once the interval has elapsed", () => {
    const last = 10 * HOUR;
    expect(isPruneDue(last + PRUNE_EVERY_MS, last)).toBe(true);
    expect(isPruneDue(last + PRUNE_EVERY_MS + 1, last)).toBe(true);
  });
});

describe("retentionCutoff", () => {
  it("is exactly the retention window behind now", () => {
    const now = Date.parse("2026-07-16T12:00:00Z");
    expect(retentionCutoff(now).getTime()).toBe(now - RETENTION_MS);
  });

  it("keeps 7 days", () => {
    expect(RETENTION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
