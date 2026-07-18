import { describe, expect, it } from "bun:test";

import {
  backoffTicks,
  HostBackoff,
  mapLimit,
  MAX_BACKOFF_TICKS,
} from "./sweep";

describe("backoffTicks", () => {
  it("doubles per consecutive failure and caps", () => {
    expect(backoffTicks(0)).toBe(0);
    expect(backoffTicks(1)).toBe(1);
    expect(backoffTicks(2)).toBe(2);
    expect(backoffTicks(3)).toBe(4);
    expect(backoffTicks(4)).toBe(8);
    expect(backoffTicks(10)).toBe(MAX_BACKOFF_TICKS);
  });
});

describe("mapLimit", () => {
  it("processes every item exactly once", async () => {
    const seen: number[] = [];
    await mapLimit([1, 2, 3, 4, 5], 2, async (n) => {
      seen.push(n);
    });
    expect(seen.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });

  it("never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let peak = 0;
    await mapLimit(Array.from({ length: 20 }, (_, i) => i), 4, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await Promise.resolve();
      await Promise.resolve();
      inFlight--;
    });
    expect(peak).toBeLessThanOrEqual(4);
  });

  it("handles an empty list", async () => {
    let called = 0;
    await mapLimit([], 4, async () => {
      called++;
    });
    expect(called).toBe(0);
  });
});

describe("HostBackoff", () => {
  it("does not skip a host with no failures", () => {
    const b = new HostBackoff();
    b.nextTick();
    expect(b.shouldSkip("a")).toBe(false);
  });

  it("skips a failed host for the next tick, then retries", () => {
    const b = new HostBackoff();
    b.nextTick(); // tick 1
    b.onFailure("a"); // 1 fail → skip 1 tick (skipUntil = 2)
    b.nextTick(); // tick 2 — reached skipUntil, retry allowed
    expect(b.shouldSkip("a")).toBe(false);
  });

  it("escalates the skip window on repeated failures", () => {
    const b = new HostBackoff();
    b.nextTick(); // 1
    b.onFailure("a"); // fail1 → skipUntil 2
    b.nextTick(); // 2
    b.onFailure("a"); // fail2 → skipUntil 4
    // tick 2: skipUntil is 4, so tick 3 must still skip
    b.nextTick(); // 3
    expect(b.shouldSkip("a")).toBe(true);
    b.nextTick(); // 4
    expect(b.shouldSkip("a")).toBe(false);
  });

  it("clears state on success", () => {
    const b = new HostBackoff();
    b.nextTick();
    b.onFailure("a");
    expect(b.size()).toBe(1);
    b.onSuccess("a");
    expect(b.size()).toBe(0);
    expect(b.shouldSkip("a")).toBe(false);
  });

  it("tracks hosts independently", () => {
    const b = new HostBackoff();
    b.nextTick();
    b.onFailure("a");
    b.onFailure("a");
    b.nextTick();
    expect(b.shouldSkip("a")).toBe(true);
    expect(b.shouldSkip("b")).toBe(false);
  });
});
