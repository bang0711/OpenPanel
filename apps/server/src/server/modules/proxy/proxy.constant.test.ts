import { describe, expect, it } from "bun:test";

import {
  DOMAIN_RE,
  HOST_RE,
  isValidDomain,
  isValidHost,
  isValidName,
  isValidPort,
  MARKER,
  NAME_RE,
  SITES_AVAILABLE,
  SITES_ENABLED,
} from "./proxy.constant";

describe("path constants", () => {
  it("point at the nginx site directories", () => {
    expect(SITES_AVAILABLE).toBe("/etc/nginx/sites-available");
    expect(SITES_ENABLED).toBe("/etc/nginx/sites-enabled");
    expect(MARKER).toBe("# openpanel-proxy");
  });
});

// `name` becomes a filename under sites-available and is interpolated into
// `ln -s` / `rm` commands.
describe("isValidName", () => {
  it("accepts realistic site names", () => {
    for (const n of ["example.com", "my_site", "site-1", "app.conf", "a"]) {
      expect(isValidName(n)).toBe(true);
    }
  });

  it("rejects shell metacharacters and command substitution", () => {
    for (const n of [
      "site;id",
      "site|id",
      "site&id",
      "site$(id)",
      "site`id`",
      "$PATH",
      "site>x",
      "site<x",
      "(site)",
      "my site",
      "'site'",
      '"site"',
      "site\\x",
      "site*",
    ]) {
      expect(isValidName(n)).toBe(false);
    }
  });

  it("rejects traversal and slashes so the name cannot escape sites-available", () => {
    expect(isValidName("../../etc/nginx/nginx.conf")).toBe(false);
    expect(isValidName("a/b")).toBe(false);
    expect(isValidName("/etc/passwd")).toBe(false);
    expect(isValidName("site\0")).toBe(false);
  });

  // JS `$` (no /m) anchors at end-of-input — nothing rides along after a newline.
  it("is anchored against appended/prepended/embedded payloads", () => {
    expect(isValidName("site\nevil; id")).toBe(false);
    expect(isValidName("site\n")).toBe(false);
    expect(isValidName("\nsite")).toBe(false);
    expect(isValidName("site\r\nid")).toBe(false);
    expect(isValidName("id site")).toBe(false);
  });

  it("rejects empty and unicode names", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("sïte")).toBe(false);
  });

  // Shell-safe but path-ish; the regex has no length cap either.
  it("accepts dot-only names and unbounded length", () => {
    expect(isValidName("..")).toBe(true);
    expect(isValidName(".")).toBe(true);
    expect(isValidName("a".repeat(5000))).toBe(true);
  });

  it("NAME_RE has no global flag (stateless across calls)", () => {
    expect(NAME_RE.global).toBe(false);
    expect(isValidName("site")).toBe(true);
    expect(isValidName("site")).toBe(true);
  });
});

// `domain` lands in a `server_name` directive in the generated nginx config.
describe("isValidDomain", () => {
  it("accepts realistic domains", () => {
    for (const d of ["example.com", "www.example.com", "my-app.internal", "localhost"]) {
      expect(isValidDomain(d)).toBe(true);
    }
  });

  it("rejects metacharacters that would break out of the nginx directive", () => {
    for (const d of [
      "example.com; return 301 http://evil",
      "example.com {",
      "example.com}",
      "example.com|id",
      "example.com$(id)",
      "example.com`id`",
      "$host",
      "example.com evil.com", // space would add a second server_name
      "'example.com'",
      '"example.com"',
      "example.com#",
      "example.com\0",
    ]) {
      expect(isValidDomain(d)).toBe(false);
    }
  });

  it("is anchored against newline payloads that would inject a config line", () => {
    expect(isValidDomain("example.com\nevil; id")).toBe(false);
    expect(isValidDomain("example.com\n    proxy_pass http://evil;")).toBe(false);
    expect(isValidDomain("example.com\n")).toBe(false);
    expect(isValidDomain("\nexample.com")).toBe(false);
    expect(isValidDomain("example.com\r\nid")).toBe(false);
  });

  it("rejects empty and unicode domains", () => {
    expect(isValidDomain("")).toBe(false);
    expect(isValidDomain("exämple.com")).toBe(false);
    expect(isValidDomain("../etc")).toBe(false);
  });

  // Unlike ssl.constant's isValidDomain, this one is regex-only: no 253-char cap
  // and no empty-label check. Shell/config-safe, just not a valid hostname.
  it("accepts malformed-but-safe hostnames", () => {
    expect(isValidDomain("example..com")).toBe(true);
    expect(isValidDomain(".")).toBe(true);
    expect(isValidDomain("-")).toBe(true);
    expect(isValidDomain(`${"a".repeat(300)}.com`)).toBe(true);
  });
});

// `host` lands in the `proxy_pass http://<host>:<port>` upstream.
describe("isValidHost", () => {
  it("accepts realistic upstream hosts", () => {
    for (const h of ["127.0.0.1", "localhost", "backend.internal", "app-1"]) {
      expect(isValidHost(h)).toBe(true);
    }
  });

  it("rejects metacharacters, URLs and traversal", () => {
    for (const h of [
      "127.0.0.1;id",
      "127.0.0.1 | id",
      "$(id)",
      "`id`",
      "http://127.0.0.1", // scheme is added by the template, not the value
      "127.0.0.1:8080/../admin",
      "127.0.0.1/x",
      "user@host",
      "[::1]", // brackets are not allowed — IPv6 literals are unsupported
      "host\0",
    ]) {
      expect(isValidHost(h)).toBe(false);
    }
  });

  it("is anchored against newline payloads", () => {
    expect(isValidHost("127.0.0.1\nevil; id")).toBe(false);
    expect(isValidHost("127.0.0.1\n")).toBe(false);
    expect(isValidHost("\n127.0.0.1")).toBe(false);
    expect(isValidHost("127.0.0.1\r\nid")).toBe(false);
  });

  it("rejects empty and unicode hosts", () => {
    expect(isValidHost("")).toBe(false);
    expect(isValidHost("hÖst")).toBe(false);
  });

  it("HOST_RE has no global flag (stateless across calls)", () => {
    expect(HOST_RE.global).toBe(false);
    expect(isValidHost("localhost")).toBe(true);
    expect(isValidHost("localhost")).toBe(true);
  });
});

describe("isValidPort", () => {
  it("accepts the full valid range", () => {
    for (const p of [1, 80, 443, 8080, 65535]) expect(isValidPort(p)).toBe(true);
  });

  it("rejects out-of-range ports", () => {
    for (const p of [0, -1, -8080, 65536, 99999]) expect(isValidPort(p)).toBe(false);
  });

  it("rejects non-integers and non-numbers", () => {
    for (const p of [8080.5, NaN, Infinity, -Infinity]) {
      expect(isValidPort(p)).toBe(false);
    }
    // Guards against a JSON body smuggling a string/array that coerces in a
    // template literal (`Number.isInteger` is type-strict, unlike `>=`/`<=`).
    for (const p of ["8080", "8080; id", true, null, undefined, [8080], {}]) {
      expect(isValidPort(p as unknown as number)).toBe(false);
    }
  });
});
