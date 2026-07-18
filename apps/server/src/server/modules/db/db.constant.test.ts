import { describe, expect, it } from "bun:test";

import {
  DB_ENGINES,
  ENGINE_COMMANDS,
  isValidIdent,
  isValidPassword,
} from "./db.constant";

describe("DB_ENGINES", () => {
  it("is exactly the engines we support", () => {
    expect([...DB_ENGINES]).toEqual(["mysql", "postgres"]);
  });

  it("rejects near-misses", () => {
    const has = (s: string) => (DB_ENGINES as readonly string[]).includes(s);
    for (const bad of ["MySQL", "postgresql", "postgres ", "mysqld", "sqlite", ""]) {
      expect(has(bad)).toBe(false);
    }
  });

  it("has a command table entry per engine", () => {
    for (const engine of DB_ENGINES) expect(ENGINE_COMMANDS[engine]).toBeDefined();
  });
});

// Identifiers are interpolated into both SQL and the shell command string
// (`createdb ${n}`), so this allowlist is the only escaping there is.
describe("isValidIdent", () => {
  it("accepts real database and user names", () => {
    expect(isValidIdent("wordpress")).toBe(true);
    expect(isValidIdent("app_db_1")).toBe(true);
    expect(isValidIdent("Users")).toBe(true);
    expect(isValidIdent("123")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "db; id",
      "db|id",
      "db&&id",
      "db$(id)",
      "db`id`",
      "db>f",
      "db<f",
      "db(x)",
      "db 'x'",
      'db"x"',
      "my db",
      "db\0",
      "db*",
      "../etc/passwd",
      "-rf",
    ]) {
      expect(isValidIdent(bad)).toBe(false);
    }
  });

  it("rejects SQL metacharacters", () => {
    expect(isValidIdent("db--comment")).toBe(false);
    expect(isValidIdent("db;DROP DATABASE x")).toBe(false);
    expect(isValidIdent("db'")).toBe(false);
    expect(isValidIdent("db`")).toBe(false); // mysql identifier quote
    expect(isValidIdent("db.other")).toBe(false); // schema qualification
  });

  // Anchoring: `createdb wordpress\nrm -rf /` must not be one valid ident.
  it("is anchored at both ends", () => {
    expect(isValidIdent("wordpress\nevil; id")).toBe(false);
    expect(isValidIdent("evil; id\nwordpress")).toBe(false);
    expect(isValidIdent("wordpress\n")).toBe(false);
  });

  it("enforces the 64-char cap and rejects empty", () => {
    expect(isValidIdent("a".repeat(64))).toBe(true);
    expect(isValidIdent("a".repeat(65))).toBe(false);
    expect(isValidIdent("")).toBe(false);
  });

  it("rejects non-ASCII", () => {
    expect(isValidIdent("données")).toBe(false);
    expect(isValidIdent("база")).toBe(false);
  });
});

// The password is single-quoted inside SQL sent over stdin, so the charset must
// exclude anything that could close that quote or escape it.
describe("isValidPassword", () => {
  it("accepts strong passwords built from the allowed charset", () => {
    expect(isValidPassword("Str0ng!Pass")).toBe(true);
    expect(isValidPassword("aB3#xY9^qW2*")).toBe(true);
    expect(isValidPassword("a1b2c3")).toBe(true); // exactly 6
    expect(isValidPassword("p+q=r_s.t-u@v%w")).toBe(true);
    expect(isValidPassword("A".repeat(128))).toBe(true);
  });

  it("rejects the characters that could break out of the SQL quoting", () => {
    expect(isValidPassword("pass'word")).toBe(false); // closes IDENTIFIED BY '…'
    expect(isValidPassword("pass\\word")).toBe(false); // escape char
    expect(isValidPassword('pass"word')).toBe(false);
    expect(isValidPassword("pass`word")).toBe(false);
    expect(isValidPassword("pass;DROP")).toBe(false);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of ["pa$$word1", "pass&word", "pass|word", "pass(word)", "pass>word", "pass$(id)"]) {
      expect(isValidPassword(bad)).toBe(false);
    }
  });

  it("rejects newlines, NUL and whitespace", () => {
    expect(isValidPassword("passw0rd\nDROP DATABASE x;")).toBe(false);
    expect(isValidPassword("passw0rd\n")).toBe(false);
    expect(isValidPassword("passw0rd\0")).toBe(false);
    expect(isValidPassword("pass w0rd")).toBe(false);
    expect(isValidPassword("passw0rd\t")).toBe(false);
  });

  it("enforces the 6..128 length bounds", () => {
    expect(isValidPassword("a1b2c")).toBe(false); // 5
    expect(isValidPassword("A".repeat(129))).toBe(false);
    expect(isValidPassword("")).toBe(false);
  });

  // Usability note, not a vulnerability: the allowlist is narrower than most
  // password managers generate, so plenty of *strong* passwords are refused.
  // Deliberate (see db.constant.ts:8) — the cost is user friction, and every
  // rejection below is safe-by-default.
  it("rejects strong passwords that use characters outside the allowlist", () => {
    expect(isValidPassword("Tr0ub4dor&3")).toBe(false); // `&`
    expect(isValidPassword("correct horse battery")).toBe(false); // spaces
    expect(isValidPassword("Xyz{123}")).toBe(false); // braces
    expect(isValidPassword("a?b/c:d1")).toBe(false); // `? / :`
    expect(isValidPassword("~tilde1")).toBe(false);
    expect(isValidPassword("pässwörd1")).toBe(false); // no unicode
    expect(isValidPassword("🔐secret1")).toBe(false);
  });
});

// Pure string builders. Callers must validate identifiers first — these do no
// escaping of their own, which is exactly what the tests below pin down.
describe("ENGINE_COMMANDS", () => {
  it("builds mysql commands with escaped identifier backticks", () => {
    const m = ENGINE_COMMANDS.mysql;
    expect(m.detect).toBe("command -v mysql");
    // No hardcoded sudo — runPrivileged escalates to root. Postgres keeps
    // `sudo -u postgres` because that's a user-switch (peer auth), not root.
    expect(m.sqlShell).toBe("mysql");
    expect(m.createDatabase("wp")).toBe('mysql -e "CREATE DATABASE \\`wp\\`"');
    expect(m.dropDatabase("wp")).toBe('mysql -e "DROP DATABASE \\`wp\\`"');
    expect(m.createUserSql("bob", "Str0ng!Pass")).toBe(
      "CREATE USER 'bob'@'localhost' IDENTIFIED BY 'Str0ng!Pass';",
    );
    expect(m.grantSql("bob", "wp")).toBe(
      "GRANT ALL PRIVILEGES ON `wp`.* TO 'bob'@'localhost'; FLUSH PRIVILEGES;",
    );
  });

  it("builds postgres commands", () => {
    const p = ENGINE_COMMANDS.postgres;
    expect(p.detect).toBe("command -v psql");
    expect(p.sqlShell).toBe("sudo -u postgres psql");
    expect(p.createDatabase("wp")).toBe("sudo -u postgres createdb wp");
    expect(p.dropDatabase("wp")).toBe("sudo -u postgres dropdb wp");
    expect(p.createUserSql("bob", "Str0ng!Pass")).toBe(
      "CREATE USER bob WITH PASSWORD 'Str0ng!Pass';",
    );
    expect(p.grantSql("bob", "wp")).toBe(
      "GRANT ALL PRIVILEGES ON DATABASE wp TO bob;",
    );
  });

  // Documents the contract: these builders are NOT a validation boundary. If a
  // caller ever skips isValidIdent, injection is trivial — pinned here so the
  // dependency on isValidIdent stays visible.
  it("does not escape a hostile identifier", () => {
    expect(ENGINE_COMMANDS.postgres.createDatabase("x; id")).toContain("; id");
    expect(ENGINE_COMMANDS.mysql.grantSql("u", "x`.*; --")).toContain("; --");
  });
});
