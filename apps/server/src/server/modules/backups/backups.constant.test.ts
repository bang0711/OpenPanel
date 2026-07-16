import { describe, expect, it } from "bun:test";

import { BACKUP_KINDS, DB_IDENT_RE, isValidSource } from "./backups.constant";

describe("BACKUP_KINDS", () => {
  it("has exactly the two kinds", () => {
    expect([...BACKUP_KINDS]).toEqual(["files", "db"]);
  });

  it("rejects near-misses", () => {
    const kinds: readonly string[] = BACKUP_KINDS;
    expect(kinds.includes("file")).toBe(false);
    expect(kinds.includes("database")).toBe(false);
    expect(kinds.includes("Files")).toBe(false);
  });
});

// isValidSource is the gate for a string that `buildBackupCommand` interpolates
// into mysqldump / tar. Unknown kinds must fail closed.
describe("isValidSource — unknown kind", () => {
  it("rejects any source when the kind is not allowlisted", () => {
    expect(isValidSource("", "/var/www")).toBe(false);
    expect(isValidSource("DB", "openpanel")).toBe(false);
    expect(isValidSource("shell", "id")).toBe(false);
    expect(isValidSource("__proto__", "x")).toBe(false);
  });
});

describe("isValidSource — db", () => {
  it("accepts bare identifiers", () => {
    expect(isValidSource("db", "openpanel")).toBe(true);
    expect(isValidSource("db", "my_db_1")).toBe(true);
  });

  // The db source is interpolated UNQUOTED (`sudo mysqldump ${source}`), so
  // every metachar has to be rejected right here.
  it("rejects shell metacharacters and punctuation", () => {
    for (const bad of [
      "db; id",
      "db|id",
      "db&id",
      "db$(id)",
      "db`id`",
      "db>/tmp/x",
      "db<x",
      "(db)",
      "my db",
      "db'",
      'db"',
      "db\0",
      "my-db",
      "my.db",
      "../etc/passwd",
      "",
    ]) {
      expect(isValidSource("db", bad)).toBe(false);
    }
  });

  it("is anchored — no prefix, suffix, or embedded newline", () => {
    expect(isValidSource("db", "db\nevil; id")).toBe(false);
    expect(isValidSource("db", "evil; id\ndb")).toBe(false);
    expect(isValidSource("db", "db\n")).toBe(false);
  });

  // Regression: had no cap, unlike db-backup's isValidDb. The db source is
  // interpolated UNQUOTED (`mysqldump ${source}`), so it gets the strictest
  // treatment: bare identifiers, capped.
  it("caps the length", () => {
    expect(isValidSource("db", "a".repeat(64))).toBe(true);
    expect(isValidSource("db", "a".repeat(65))).toBe(false);
    expect(isValidSource("db", "a".repeat(5000))).toBe(false);
  });
});

describe("isValidSource — files", () => {
  it("accepts absolute local paths", () => {
    expect(isValidSource("files", "/var/www")).toBe(true);
    expect(isValidSource("files", "/home/deploy/app")).toBe(true);
    expect(isValidSource("files", "/")).toBe(true);
  });

  it("rejects relative paths and traversal", () => {
    expect(isValidSource("files", "var/www")).toBe(false);
    expect(isValidSource("files", "")).toBe(false);
    expect(isValidSource("files", "../etc")).toBe(false);
    expect(isValidSource("files", "/var/www/../../etc/shadow")).toBe(false);
    expect(isValidSource("files", "/var/..")).toBe(false);
    // s3:// style remote targets are not local paths.
    expect(isValidSource("files", "s3://bucket/key")).toBe(false);
  });

  // The path is emitted inside a single-quoted shell word and `'` is rejected,
  // so it cannot break out; newline/CR are rejected for the same reason.
  it("rejects the characters that could escape the single-quoted word", () => {
    expect(isValidSource("files", "/var/www'; id; '")).toBe(false);
    expect(isValidSource("files", "/var/www\nid")).toBe(false);
    expect(isValidSource("files", "/var/www\rid")).toBe(false);
    expect(isValidSource("files", "/var/www\n")).toBe(false);
  });

  // Deliberate, and load-bearing: `files` sources are interpolated inside
  // SINGLE QUOTES by buildBackupCommand, which makes these inert. They are
  // legal characters in filenames, so rejecting them would break real paths.
  // The contract is: reject `'` (the only break-out), and never interpolate a
  // files source unquoted. This test pins that coupling — if someone drops the
  // quotes, the pairing to re-check is here.
  it("accepts metacharacters that are inert inside single quotes", () => {
    expect(isValidSource("files", "/var/www; id")).toBe(true);
    expect(isValidSource("files", "/var/$(id)")).toBe(true);
    expect(isValidSource("files", "/var/`id`")).toBe(true);
    expect(isValidSource("files", "/srv/my app")).toBe(true);
  });

  it("rejects the single quote that would break out of that quoting", () => {
    expect(isValidSource("files", "/var/'; id; '")).toBe(false);
    expect(isValidSource("files", "/var/www'")).toBe(false);
  });

  it("rejects a NUL byte, which cannot cross the boundary intact", () => {
    expect(isValidSource("files", "/var/www\0")).toBe(false);
  });

  it("caps the path length", () => {
    expect(isValidSource("files", "/" + "a".repeat(4095))).toBe(true);
    expect(isValidSource("files", "/" + "a".repeat(4096))).toBe(false);
  });
});

describe("DB_IDENT_RE", () => {
  it("is stateless across calls", () => {
    expect(DB_IDENT_RE.global).toBe(false);
    expect(DB_IDENT_RE.test("db")).toBe(true);
    expect(DB_IDENT_RE.test("db")).toBe(true);
  });
});
