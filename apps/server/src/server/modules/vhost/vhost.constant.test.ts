import { describe, expect, it } from "bun:test";

import {
  isValidSite,
  MAX_CONFIG_BYTES,
  SITE_RE,
  SITES_AVAILABLE,
  SITES_ENABLED,
} from "./vhost.constant";

describe("vhost constants", () => {
  it("points at the nginx site dirs", () => {
    expect(SITES_AVAILABLE).toBe("/etc/nginx/sites-available");
    expect(SITES_ENABLED).toBe("/etc/nginx/sites-enabled");
  });

  it("caps configs at 64 KB", () => {
    expect(MAX_CONFIG_BYTES).toBe(65536);
  });
});

// The site name is interpolated unquoted into `ln -sf .../<name>` and `rm -f
// .../<name>`, and into an SFTP path — one regex guards both.
describe("isValidSite", () => {
  it("accepts real site names", () => {
    expect(isValidSite("example.com")).toBe(true);
    expect(isValidSite("default")).toBe(true);
    expect(isValidSite("my-app_v2.conf")).toBe(true);
    expect(isValidSite("api.staging.example.com")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "site; id",
      "site|id",
      "site&&id",
      "site$(id)",
      "site`id`",
      "site>f",
      "site<f",
      "site(x)",
      "site 'x'",
      'site"x"',
      "my site",
      "site\0",
      "site*",
      "$HOME",
    ]) {
      expect(isValidSite(bad)).toBe(false);
    }
  });

  // A leading `-` passes, but every call site prefixes the name with an
  // absolute dir (`.../sites-enabled/-rf`), so it can't be read as a flag.
  it("accepts a leading hyphen (inert — always path-prefixed)", () => {
    expect(isValidSite("-rf")).toBe(true);
  });

  // A slash would let a name escape SITES_AVAILABLE entirely.
  it("rejects path separators and traversal sequences", () => {
    expect(isValidSite("../../etc/passwd")).toBe(false);
    expect(isValidSite("a/b")).toBe(false);
    expect(isValidSite("/etc/shadow")).toBe(false);
  });

  // Anchoring: `rm -f /etc/nginx/sites-enabled/site\nrm -rf /` would be two
  // commands if the regex were unanchored.
  it("is anchored at both ends", () => {
    expect(isValidSite("example.com\nevil; id")).toBe(false);
    expect(isValidSite("evil; id\nexample.com")).toBe(false);
    expect(isValidSite("example.com\n")).toBe(false);
  });

  it("rejects empty and non-string input", () => {
    expect(isValidSite("")).toBe(false);
    expect(isValidSite(null as unknown as string)).toBe(false);
    expect(isValidSite(undefined as unknown as string)).toBe(false);
    expect(isValidSite(123 as unknown as string)).toBe(false);
  });

  it("rejects non-ASCII domain names", () => {
    expect(isValidSite("münchen.de")).toBe(false); // punycode expected instead
  });

  // Regression: SITE_RE allows `.` freely, so `.` and `..` passed and reached
  // `ln -sf .../sites-available/..` and `rm -f .../sites-enabled/..` — the
  // parent directory itself. No slash is allowed so they could not escape
  // /etc/nginx, but a name resolving to a directory must not reach the builder.
  it("rejects the dot and dot-dot names", () => {
    expect(isValidSite(".")).toBe(false);
    expect(isValidSite("..")).toBe(false);
  });

  it("still accepts names that merely contain dots", () => {
    expect(isValidSite("example.com")).toBe(true);
    expect(isValidSite("api.example.co.uk")).toBe(true);
  });

  // Regression: every sibling module caps at 128; this one had no cap at all.
  it("caps the name length", () => {
    expect(isValidSite("a".repeat(128))).toBe(true);
    expect(isValidSite("a".repeat(129))).toBe(false);
    expect(isValidSite("a".repeat(10000))).toBe(false);
  });

  it("exports the regex used by the helper", () => {
    expect(SITE_RE.test("example.com")).toBe(true);
  });
});
