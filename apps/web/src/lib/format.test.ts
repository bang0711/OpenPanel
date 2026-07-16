import { describe, expect, it } from "bun:test";

import { formatBytes, formatUptime } from "./format";

describe("formatBytes", () => {
  it("scales through the units", () => {
    expect(formatBytes(512)).toBe("512.0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 ** 3)).toBe("1.0 GB");
    expect(formatBytes(1024 ** 4)).toBe("1.0 TB");
  });

  it("honours the decimals argument", () => {
    expect(formatBytes(1536, 0)).toBe("2 KB");
    expect(formatBytes(1536, 2)).toBe("1.50 KB");
  });

  // Metrics come from parsing remote output, so zero/absent values are normal.
  it("treats zero, negative and NaN as 0 B", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(-1)).toBe("0 B");
    expect(formatBytes(NaN)).toBe("0 B");
  });

  // Sizes come from parsing remote `df`/`free` output; a bad parse used to run
  // the unit index off the end and render a literal "1.0 undefined".
  it("clamps at the largest unit instead of running off the table", () => {
    expect(formatBytes(1024 ** 5)).toBe("1.0 PB");
    expect(formatBytes(1024 ** 6)).toBe("1024.0 PB");
    expect(formatBytes(Number.MAX_SAFE_INTEGER)).not.toContain("undefined");
  });
});

describe("formatUptime", () => {
  it("formats days/hours/minutes", () => {
    expect(formatUptime(90061)).toBe("1d 1h 1m");
    expect(formatUptime(3660)).toBe("1h 1m");
    expect(formatUptime(60)).toBe("1m");
  });

  it("omits empty leading units", () => {
    expect(formatUptime(86400)).toBe("1d");
    expect(formatUptime(7200)).toBe("2h");
  });

  // A box up for less than a minute should read "0m", not an empty string.
  it("shows 0m under a minute", () => {
    expect(formatUptime(59)).toBe("0m");
    expect(formatUptime(1)).toBe("0m");
  });

  it("renders a dash for zero or negative", () => {
    expect(formatUptime(0)).toBe("—");
    expect(formatUptime(-5)).toBe("—");
  });
});
