import { describe, expect, it } from "bun:test";

import { DOMAIN_RE, EMAIL_RE, isValidDomain, isValidEmail } from "./ssl.constant";

// Both values are interpolated into the certbot command line.
describe("isValidDomain", () => {
  it("accepts realistic domains", () => {
    for (const d of [
      "example.com",
      "www.example.com",
      "a.b.c.example.co.uk",
      "my-site.dev",
      "xn--80ak6aa92e.com", // punycode IDN
      "localhost",
    ]) {
      expect(isValidDomain(d)).toBe(true);
    }
  });

  it("rejects shell metacharacters and command substitution", () => {
    for (const d of [
      "example.com; id",
      "example.com|id",
      "example.com&id",
      "example.com$(id)",
      "example.com`id`",
      "$HOME",
      "example.com > /tmp/x",
      "example.com<x",
      "(example.com)",
      "example.com --email evil@x.com", // certbot flag injection via space
      "'example.com'",
      '"example.com"',
    ]) {
      expect(isValidDomain(d)).toBe(false);
    }
  });

  it("rejects traversal, slashes and NUL", () => {
    expect(isValidDomain("../../etc/passwd")).toBe(false);
    expect(isValidDomain("example.com/../x")).toBe(false);
    expect(isValidDomain("example.com\0")).toBe(false);
  });

  // JS `$` (no /m) anchors at end-of-input, so a payload after a newline cannot
  // slip through — the unanchored-regex bypass does not apply.
  it("is anchored against appended/prepended/embedded payloads", () => {
    expect(isValidDomain("example.com\nevil; id")).toBe(false);
    expect(isValidDomain("example.com\n")).toBe(false);
    expect(isValidDomain("\nexample.com")).toBe(false);
    expect(isValidDomain("example.com\r\nid")).toBe(false);
    expect(isValidDomain("id example.com")).toBe(false);
  });

  it("rejects empty labels — the check DOMAIN_RE alone would miss", () => {
    expect(isValidDomain("example..com")).toBe(false);
    expect(isValidDomain(".example.com")).toBe(false);
    expect(isValidDomain("example.com.")).toBe(false); // trailing dot
    expect(isValidDomain(".")).toBe(false);
    expect(isValidDomain("")).toBe(false);
  });

  it("enforces the 253-char cap", () => {
    const label = "a".repeat(63);
    const d253 = `${label}.${label}.${label}.${"a".repeat(61)}`;
    expect(d253.length).toBe(253);
    expect(isValidDomain(d253)).toBe(true);
    expect(isValidDomain(`${d253}a`)).toBe(false);
  });

  it("rejects unicode domains (punycode only)", () => {
    expect(isValidDomain("exämple.com")).toBe(false);
    expect(isValidDomain("пример.рф")).toBe(false);
  });

  it("DOMAIN_RE has no global flag (stateless across calls)", () => {
    expect(DOMAIN_RE.global).toBe(false);
    expect(isValidDomain("example.com")).toBe(true);
    expect(isValidDomain("example.com")).toBe(true);
  });
});

describe("isValidEmail", () => {
  it("accepts realistic addresses", () => {
    for (const e of [
      "admin@example.com",
      "first.last+tag@sub.example.co.uk",
      "a@b.co",
      "user_name@example.io",
    ]) {
      expect(isValidEmail(e)).toBe(true);
    }
  });

  it("rejects whitespace-based flag injection", () => {
    expect(isValidEmail("a@b.co --force")).toBe(false);
    expect(isValidEmail("a @b.co")).toBe(false);
    expect(isValidEmail("a@b .co")).toBe(false);
    expect(isValidEmail("\ta@b.co")).toBe(false);
  });

  it("is anchored against newline payloads", () => {
    expect(isValidEmail("a@b.co\nevil; id")).toBe(false);
    expect(isValidEmail("a@b.co\n")).toBe(false);
    expect(isValidEmail("\na@b.co")).toBe(false);
    expect(isValidEmail("a@b.co\r\nid")).toBe(false);
  });

  it("rejects structurally invalid addresses", () => {
    for (const e of [
      "",
      "admin",
      "admin@",
      "@example.com",
      "admin@example", // no dot in domain
      "a@b@c.com", // `@` excluded from both sides
    ]) {
      expect(isValidEmail(e)).toBe(false);
    }
  });

  it("enforces the 254-char cap", () => {
    const local = "a".repeat(242);
    const e254 = `${local}@example.com`;
    expect(e254.length).toBe(254);
    expect(isValidEmail(e254)).toBe(true);
    expect(isValidEmail(`a${e254}`)).toBe(false);
  });

  // Regression: EMAIL_RE used `[^\s@]+`, excluding only whitespace and `@`, so
  // every shell metacharacter passed — and ssl.service.ts interpolates the
  // address UNQUOTED into `certbot ... -m ${email} -d ${domain}`. `$(id)@b.co`
  // was remote command execution as the SSH user (usually root).
  it("rejects shell metacharacters inside an address", () => {
    expect(isValidEmail("a;id@b.co")).toBe(false);
    expect(isValidEmail("$(id)@b.co")).toBe(false);
    expect(isValidEmail("`id`@b.co")).toBe(false);
    expect(isValidEmail("a|b@c.co")).toBe(false);
    expect(isValidEmail("a'b@c.co")).toBe(false);
    expect(isValidEmail("a\"b@c.co")).toBe(false);
    expect(isValidEmail("a&b@c.co")).toBe(false);
    expect(isValidEmail("../../x@b.co")).toBe(false);
    expect(isValidEmail("a\0b@c.co")).toBe(false);
    expect(isValidEmail("a>b@c.co")).toBe(false);
  });

  it("still accepts ordinary addresses", () => {
    expect(isValidEmail("admin@example.com")).toBe(true);
    expect(isValidEmail("first.last+tag@sub.example.co.uk")).toBe(true);
    expect(isValidEmail("a_b-c%d@example.io")).toBe(true);
  });

  it("EMAIL_RE has no global flag (stateless across calls)", () => {
    expect(EMAIL_RE.global).toBe(false);
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("a@b.co")).toBe(true);
  });
});
