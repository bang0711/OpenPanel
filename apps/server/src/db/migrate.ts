// Applies pending migrations at container start (the `migrate` role), replacing
// `prisma migrate deploy`. The prisma CLI + schema-engine (~235MB) exists to
// *author* migrations; applying already-authored .sql files needs none of it,
// so it is done here and compiled into the op-server binary. Authoring still
// happens on a dev machine with `prisma migrate dev` — that is unchanged.
//
// Uses `pg` — the SAME driver the app runs through @prisma/adapter-pg, already
// bundled in the binary. Sharing the driver means one DATABASE_URL (SSL params
// and all) behaves identically for migrations and for the app; an earlier
// Bun.SQL version diverged on sslmode (it rejected `no-verify`, which managed
// databases like Cloud SQL need).
import { readdirSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";

import { Client } from "pg";

import {
  type LocalMigration,
  migrationChecksum,
  planMigrations,
} from "./migrate.constant";

// Defaults to the copy the image ships at /app/server/prisma/migrations (the
// migrate role cds there). Overridable for tests / local runs.
const MIGRATIONS_DIR =
  process.env.MIGRATIONS_DIR ?? join(process.cwd(), "prisma", "migrations");

// Matches Prisma's own table exactly (see `\d _prisma_migrations`), so the two
// runners share one history.
const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
  "id"                  varchar(36)  PRIMARY KEY NOT NULL,
  "checksum"            varchar(64)  NOT NULL,
  "finished_at"         timestamptz,
  "migration_name"      varchar(255) NOT NULL,
  "logs"                text,
  "rolled_back_at"      timestamptz,
  "started_at"          timestamptz  NOT NULL DEFAULT now(),
  "applied_steps_count" integer      NOT NULL DEFAULT 0
)`;

function loadLocal(): LocalMigration[] {
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    // Lexical order is chronological: every migration name is timestamp-first.
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(MIGRATIONS_DIR, name, "migration.sql"), "utf8"),
    }));
}

export async function runMigrations(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(CREATE_TABLE);

    const local = loadLocal();
    const { rows } = await client.query(
      `SELECT migration_name, checksum, finished_at FROM "_prisma_migrations"`,
    );
    const applied = rows.map((r) => ({
      name: r.migration_name as string,
      checksum: r.checksum as string,
      finished: r.finished_at != null,
    }));

    const { pending, drift, failed } = planMigrations(local, applied);

    if (failed.length) {
      throw new Error(
        `[migrate] migration(s) started but never finished: ${failed.join(
          ", ",
        )}. A previous apply crashed; resolve the database manually before deploying.`,
      );
    }
    if (drift.length) {
      throw new Error(
        `[migrate] applied migration(s) changed on disk: ${drift
          .map((d) => d.name)
          .join(", ")}. Never edit a migration that has already been applied.`,
      );
    }
    if (!pending.length) {
      console.log("[migrate] up to date, nothing to apply");
      return;
    }

    for (const m of pending) {
      console.log(`[migrate] applying ${m.name}`);
      const id = randomUUID();
      // Record the attempt BEFORE applying, in its own committed statement, so
      // a crash mid-apply leaves a finished_at=null row that blocks the next
      // deploy (caught as `failed` above) rather than silently re-running.
      await client.query(
        `INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at)
         VALUES ($1, $2, $3, now())`,
        [id, migrationChecksum(m.sql), m.name],
      );
      // The whole migration in one transaction: a failure rolls back the schema
      // change, and the finished_at=null row above remains to flag it.
      await client.query("BEGIN");
      try {
        await client.query(m.sql);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
      await client.query(
        `UPDATE "_prisma_migrations"
         SET finished_at = now(), applied_steps_count = 1 WHERE id = $1`,
        [id],
      );
    }
    console.log(`[migrate] applied ${pending.length} migration(s)`);
  } finally {
    await client.end();
  }
}
