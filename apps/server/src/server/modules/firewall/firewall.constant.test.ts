import { describe, expect, it } from "bun:test";

import { FW_ACTIONS, FW_PROTOCOLS, isValidPort } from "./firewall.constant";

// The port reaches a `ufw` command line, so anything non-integer must die here.
describe("isValidPort", () => {
  it("accepts real ports", () => {
    expect(isValidPort(22)).toBe(true);
    expect(isValidPort(8080)).toBe(true);
  });

  it("enforces the 1..65535 boundary", () => {
    expect(isValidPort(1)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(-1)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(1e9)).toBe(false);
  });

  it("rejects non-integers", () => {
    expect(isValidPort(80.5)).toBe(false);
    expect(isValidPort(NaN)).toBe(false);
    expect(isValidPort(Infinity)).toBe(false);
  });

  // Callers may hand over unparsed client JSON; a string must never pass, or
  // `"80; id"` would be interpolated straight into the ufw command.
  it("rejects strings, even numeric-looking ones", () => {
    expect(isValidPort("80" as unknown as number)).toBe(false);
    expect(isValidPort("8o" as unknown as number)).toBe(false);
    expect(isValidPort("80/tcp" as unknown as number)).toBe(false);
    expect(isValidPort("" as unknown as number)).toBe(false);
    expect(isValidPort("22; id" as unknown as number)).toBe(false);
    expect(isValidPort(null as unknown as number)).toBe(false);
    expect(isValidPort(undefined as unknown as number)).toBe(false);
  });
});

describe("allowlists", () => {
  it("has exactly the two ufw verbs and two protocols", () => {
    expect([...FW_ACTIONS]).toEqual(["allow", "deny"]);
    expect([...FW_PROTOCOLS]).toEqual(["tcp", "udp"]);
  });

  // Near-misses: casing/aliases must not be treated as members.
  it("rejects near-misses", () => {
    const actions: readonly string[] = FW_ACTIONS;
    const protocols: readonly string[] = FW_PROTOCOLS;
    expect(actions.includes("reject")).toBe(false);
    expect(actions.includes("ALLOW")).toBe(false);
    expect(actions.includes("allow; id")).toBe(false);
    expect(protocols.includes("TCP")).toBe(false);
    expect(protocols.includes("icmp")).toBe(false);
    expect(protocols.includes("tcp\nudp")).toBe(false);
  });
});
