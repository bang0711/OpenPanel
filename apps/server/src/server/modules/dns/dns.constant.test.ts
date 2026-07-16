import { describe, expect, it } from "bun:test";

import {
  ALLOWED_PREFIXES,
  isAllowedZonePath,
  isValidZoneName,
  ZONE_RE,
} from "./dns.constant";

describe("ALLOWED_PREFIXES", () => {
  it("is the exact allowlist of BIND zone directories", () => {
    expect(ALLOWED_PREFIXES).toEqual(["/etc/bind", "/var/named"]);
  });
});

// Gates which files DNS may read/write over SFTP.
describe("isAllowedZonePath", () => {
  it("accepts the prefix itself and paths under it", () => {
    expect(isAllowedZonePath("/etc/bind")).toBe(true);
    expect(isAllowedZonePath("/etc/bind/db.example.com")).toBe(true);
    expect(isAllowedZonePath("/etc/bind/zones/db.internal")).toBe(true);
    expect(isAllowedZonePath("/var/named")).toBe(true);
    expect(isAllowedZonePath("/var/named/example.com.zone")).toBe(true);
  });

  it("rejects paths outside the allowlist", () => {
    for (const p of [
      "/etc/shadow",
      "/etc/bindings/x", // sibling dir that merely shares the prefix string
      "/etc/bind.bak/x",
      "/var/namedd/x",
      "/root/etc/bind/x", // prefix must be at the start
      "etc/bind/x",
      "",
      "/",
    ]) {
      expect(isAllowedZonePath(p)).toBe(false);
    }
  });

  // Contract is prefix-check only, not normalization: the sole caller
  // (dns.service assertPath) runs normalizeRemotePath first, which collapses
  // `..` before this ever sees the path. Called directly on a raw path it would
  // pass traversal through — pinning that so a future caller can't miss it.
  it("does not itself resolve traversal (caller must normalize first)", () => {
    expect(isAllowedZonePath("/etc/bind/../../etc/shadow")).toBe(true);
    expect(isAllowedZonePath("/etc/bind/./../root/.ssh/id_rsa")).toBe(true);
  });
});

// Interpolated into `named-checkzone <zoneName> <path>`.
describe("isValidZoneName", () => {
  it("accepts realistic zone names", () => {
    for (const n of [
      "example.com",
      "sub.example.com",
      "my-zone.internal",
      "10.in-addr.arpa",
      "A",
    ]) {
      expect(isValidZoneName(n)).toBe(true);
    }
  });

  it("rejects shell metacharacters and command substitution", () => {
    for (const n of [
      "example.com; id",
      "example.com|id",
      "example.com&&id",
      "example.com$(id)",
      "example.com`id`",
      "$PATH",
      "example.com > /etc/passwd",
      "example.com<x",
      "(example)",
      "example com",
      "'example.com'",
      '"example.com"',
      "example.com\\;id",
    ]) {
      expect(isValidZoneName(n)).toBe(false);
    }
  });

  it("rejects traversal, slashes and NUL", () => {
    expect(isValidZoneName("../../etc/passwd")).toBe(false);
    expect(isValidZoneName("/etc/bind")).toBe(false);
    expect(isValidZoneName("example.com\0")).toBe(false);
  });

  // JS `$` (no /m) anchors at end-of-input, so nothing rides along after a
  // newline — the classic unanchored-regex bypass does not apply here.
  it("is anchored against appended/embedded payloads", () => {
    expect(isValidZoneName("example.com\nevil; id")).toBe(false);
    expect(isValidZoneName("example.com\n")).toBe(false);
    expect(isValidZoneName("\nexample.com")).toBe(false);
    expect(isValidZoneName("example.com\r\nid")).toBe(false);
    expect(isValidZoneName("id example.com")).toBe(false);
  });

  it("rejects empty and unicode names", () => {
    expect(isValidZoneName("")).toBe(false);
    expect(isValidZoneName("exämple.com")).toBe(false);
    expect(isValidZoneName("例え.com")).toBe(false); // IDN must be punycode
  });

  // Shell-safe but not semantically checked — `named-checkzone` is left to
  // reject nonsense. Documenting the actual boundary, no length cap exists.
  it("accepts shell-safe but meaningless names", () => {
    expect(isValidZoneName("..")).toBe(true);
    expect(isValidZoneName("-")).toBe(true);
    expect(isValidZoneName("a".repeat(5000))).toBe(true);
  });

  it("ZONE_RE has no global flag (stateless across calls)", () => {
    expect(ZONE_RE.global).toBe(false);
    expect(isValidZoneName("example.com")).toBe(true);
    expect(isValidZoneName("example.com")).toBe(true);
  });
});
