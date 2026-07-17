import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Regression: a migration.sql applied from a Windows checkout (CRLF) then
// re-checked by the Linux image (LF) hashed to different checksums, so the
// migrate drift guard rejected the deploy. `.gitattributes` forces these files
// to LF everywhere; this fails if one ever slips back to CRLF, which would
// desync the runner's checksum across platforms.
const MIGRATIONS = join(import.meta.dir, "..", "..", "prisma", "migrations");

describe("migration files are LF-only", () => {
  const dirs = readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  it("has at least one migration to check", () => {
    expect(dirs.length).toBeGreaterThan(0);
  });

  for (const d of dirs) {
    it(`${d}/migration.sql contains no carriage return`, () => {
      const sql = readFileSync(join(MIGRATIONS, d, "migration.sql"), "utf8");
      expect(sql.includes("\r")).toBe(false);
    });
  }
});
