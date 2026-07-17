import { describe, expect, it } from "bun:test";

import {
  type AppliedMigration,
  type LocalMigration,
  migrationChecksum,
  planMigrations,
} from "./migrate.constant";

describe("migrationChecksum", () => {
  // Must equal plain sha256(bytes) in lowercase hex — this is what Prisma
  // stores, and the whole point is that the two agree. Verified against a real
  // `prisma migrate deploy`: the init migration hashed to this value.
  it("is sha256 hex of the sql bytes", () => {
    expect(migrationChecksum("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(migrationChecksum("SELECT 1;")).toBe(
      "17db4fd369edb9244b9f91d9aeed145c3d04ad8ba6e95d06247f07a63527d11a",
    );
  });

  it("is stable and case-consistent", () => {
    const a = migrationChecksum("CREATE TABLE x (id int);");
    expect(a).toBe(migrationChecksum("CREATE TABLE x (id int);"));
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes when a single byte changes", () => {
    expect(migrationChecksum("a")).not.toBe(migrationChecksum("A"));
  });
});

const local = (name: string, sql: string): LocalMigration => ({ name, sql });
const applied = (
  name: string,
  sql: string,
  finished = true,
): AppliedMigration => ({ name, checksum: migrationChecksum(sql), finished });

describe("planMigrations", () => {
  it("marks every migration pending against an empty database", () => {
    const l = [local("1_a", "A"), local("2_b", "B")];
    const plan = planMigrations(l, []);
    expect(plan.pending.map((m) => m.name)).toEqual(["1_a", "2_b"]);
    expect(plan.drift).toEqual([]);
    expect(plan.failed).toEqual([]);
  });

  it("skips already-applied migrations with a matching checksum", () => {
    const l = [local("1_a", "A"), local("2_b", "B")];
    const plan = planMigrations(l, [applied("1_a", "A")]);
    expect(plan.pending.map((m) => m.name)).toEqual(["2_b"]);
  });

  it("applies nothing when the database is up to date", () => {
    const l = [local("1_a", "A")];
    const plan = planMigrations(l, [applied("1_a", "A")]);
    expect(plan.pending).toEqual([]);
    expect(plan.drift).toEqual([]);
  });

  it("preserves input order in the pending list", () => {
    const l = [local("1_a", "A"), local("2_b", "B"), local("3_c", "C")];
    expect(planMigrations(l, []).pending.map((m) => m.name)).toEqual([
      "1_a",
      "2_b",
      "3_c",
    ]);
  });

  // A file edited after it was applied — the checksum no longer matches. This
  // is the guard that makes the runner safe to trust.
  it("flags drift when an applied migration's sql changed", () => {
    const l = [local("1_a", "A -- edited")];
    const plan = planMigrations(l, [applied("1_a", "A")]);
    expect(plan.pending).toEqual([]);
    expect(plan.drift).toHaveLength(1);
    expect(plan.drift[0]!.name).toBe("1_a");
    expect(plan.drift[0]!.actual).toBe(migrationChecksum("A -- edited"));
    expect(plan.drift[0]!.expected).toBe(migrationChecksum("A"));
  });

  // A row exists but finished_at was null: a prior apply crashed. Never treat
  // it as pending (would double-apply) nor as done (schema is unknown).
  it("flags a migration that started but never finished as failed", () => {
    const l = [local("1_a", "A")];
    const plan = planMigrations(l, [applied("1_a", "A", false)]);
    expect(plan.failed).toEqual(["1_a"]);
    expect(plan.pending).toEqual([]);
    expect(plan.drift).toEqual([]);
  });

  it("handles a mix: applied, pending, drifted, failed", () => {
    const l = [
      local("1_done", "A"),
      local("2_fail", "B"),
      local("3_drift", "C2"),
      local("4_new", "D"),
    ];
    const plan = planMigrations(l, [
      applied("1_done", "A"),
      applied("2_fail", "B", false),
      applied("3_drift", "C1"), // stored checksum is for "C1", file is now "C2"
    ]);
    expect(plan.pending.map((m) => m.name)).toEqual(["4_new"]);
    expect(plan.failed).toEqual(["2_fail"]);
    expect(plan.drift.map((d) => d.name)).toEqual(["3_drift"]);
  });

  it("ignores rows in the table that have no local file (already-squashed)", () => {
    const l = [local("2_b", "B")];
    const plan = planMigrations(l, [applied("1_gone", "A"), applied("2_b", "B")]);
    expect(plan.pending).toEqual([]);
    expect(plan.drift).toEqual([]);
    expect(plan.failed).toEqual([]);
  });
});
