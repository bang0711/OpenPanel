// Pure migration-planning logic, kept separate from the pg/filesystem IO so it
// can be tested with no database. The runner in migrate.ts applies the plan.
//
// The bookkeeping is deliberately Prisma-compatible: same `_prisma_migrations`
// table, same checksum (plain sha256 of the migration.sql bytes, lowercase
// hex). A database migrated by `prisma migrate deploy` and one migrated by this
// runner are therefore interchangeable — the runner skips what Prisma already
// applied, and vice versa.
import { createHash } from "node:crypto";

export function migrationChecksum(sql: string): string {
  return createHash("sha256").update(sql, "utf8").digest("hex");
}

export interface LocalMigration {
  name: string;
  sql: string;
}

export interface AppliedMigration {
  name: string;
  checksum: string;
  // finished_at IS NOT NULL. A row with finished=false is a migration whose
  // apply crashed partway — the schema is in an unknown state.
  finished: boolean;
}

export interface MigrationPlan {
  pending: LocalMigration[];
  // Applied migrations whose file changed after the fact. Editing an applied
  // migration is always a mistake; fail loudly rather than silently ignore it.
  drift: { name: string; expected: string; actual: string }[];
  // Migrations recorded but never finished (a previous crash). Fatal: the DB
  // needs manual attention before more migrations are safe to apply.
  failed: string[];
}

/**
 * Decide what to do, given the local migration files (already sorted) and the
 * rows in `_prisma_migrations`. Pure: no IO, no ordering side effects.
 */
export function planMigrations(
  local: LocalMigration[],
  applied: AppliedMigration[],
): MigrationPlan {
  const byName = new Map(applied.map((a) => [a.name, a]));
  const pending: LocalMigration[] = [];
  const drift: MigrationPlan["drift"] = [];
  const failed: string[] = [];

  for (const m of local) {
    const a = byName.get(m.name);
    if (!a) {
      pending.push(m);
      continue;
    }
    if (!a.finished) {
      failed.push(m.name);
      continue;
    }
    const actual = migrationChecksum(m.sql);
    if (a.checksum !== actual) {
      drift.push({ name: m.name, expected: a.checksum, actual });
    }
  }

  return { pending, drift, failed };
}
