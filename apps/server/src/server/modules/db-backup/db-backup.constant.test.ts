import { describe, expect, it } from "bun:test";

import { BACKUP_ENGINES, DB_IDENT_RE, DEFAULT_DIR, isValidDb } from "./db-backup.constant";

// DB names land in `mysqldump <db>` / `pg_dump <db>` — unquoted identifiers.
describe("isValidDb", () => {
  it("accepts bare identifiers", () => {
    expect(isValidDb("openpanel")).toBe(true);
    expect(isValidDb("my_db_1")).toBe(true);
    expect(isValidDb("DB2")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "db; id",
      "db|id",
      "db&id",
      "db$(id)",
      "db`id`",
      "db > /tmp/x",
      "db<x",
      "(db)",
      "my db",
      "db'",
      'db"',
      "db\0",
      "$DB",
      "*",
    ]) {
      expect(isValidDb(bad)).toBe(false);
    }
  });

  // Even SQL-legal punctuation is out: hyphen/dot would also widen the shell
  // surface (option injection, path-looking args).
  it("rejects punctuation outside [A-Za-z0-9_]", () => {
    expect(isValidDb("my-db")).toBe(false);
    expect(isValidDb("my.db")).toBe(false);
    expect(isValidDb("../etc/passwd")).toBe(false);
    expect(isValidDb("--all-databases")).toBe(false);
  });

  it("is anchored — no prefix, suffix, or embedded newline", () => {
    expect(isValidDb("db\nevil; id")).toBe(false);
    expect(isValidDb("evil; id\ndb")).toBe(false);
    expect(isValidDb("db\n")).toBe(false);
    expect(isValidDb(" db")).toBe(false);
    expect(isValidDb("db ")).toBe(false);
  });

  it("rejects empty and over-long names", () => {
    expect(isValidDb("")).toBe(false);
    expect(isValidDb("a".repeat(64))).toBe(true);
    expect(isValidDb("a".repeat(65))).toBe(false);
  });

  it("uses a stateless regex", () => {
    expect(DB_IDENT_RE.global).toBe(false);
    expect(DB_IDENT_RE.test("db")).toBe(true);
    expect(DB_IDENT_RE.test("db")).toBe(true);
  });
});

describe("BACKUP_ENGINES", () => {
  it("has exactly the two supported engines", () => {
    expect([...BACKUP_ENGINES]).toEqual(["mysql", "postgres"]);
  });

  it("rejects near-misses", () => {
    const engines: readonly string[] = BACKUP_ENGINES;
    expect(engines.includes("mariadb")).toBe(false);
    expect(engines.includes("postgresql")).toBe(false);
    expect(engines.includes("MySQL")).toBe(false);
    expect(engines.includes("mysql; id")).toBe(false);
  });
});

describe("DEFAULT_DIR", () => {
  // A relative or traversing default would escape the intended backup root.
  it("is an absolute, traversal-free local path", () => {
    expect(DEFAULT_DIR).toBe("/var/backups/openpanel");
    expect(DEFAULT_DIR.startsWith("/")).toBe(true);
    expect(DEFAULT_DIR).not.toContain("..");
  });
});
