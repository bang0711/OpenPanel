import { describe, expect, it } from "bun:test";

import { DOCKER_ACTIONS, ID_RE, isValidId } from "./docker.constant";

describe("DOCKER_ACTIONS", () => {
  it("is exactly the container verbs we support", () => {
    expect([...DOCKER_ACTIONS]).toEqual(["start", "stop", "restart", "rm"]);
  });

  // The action is interpolated into `docker <action> <id>`; membership is the
  // only guard, so a near-miss must not slip through.
  it("rejects near-misses and payloads", () => {
    const has = (s: string) => (DOCKER_ACTIONS as readonly string[]).includes(s);
    for (const bad of [
      "START",
      "Rm",
      "restartx",
      "rmi",
      "exec",
      "rm -f",
      "rm; id",
      "stop\nrm",
      "",
    ]) {
      expect(has(bad)).toBe(false);
    }
  });
});

describe("isValidId", () => {
  it("accepts real container ids and names", () => {
    expect(isValidId("3f2a1b9c8d7e")).toBe(true); // 12-hex short id
    expect(isValidId("a".repeat(64))).toBe(true); // full id
    expect(isValidId("my_app-1")).toBe(true);
    expect(isValidId("registry.local.web")).toBe(true);
  });

  it("rejects shell metacharacters", () => {
    for (const bad of [
      "abc; id",
      "abc|id",
      "abc&&id",
      "abc$(id)",
      "abc`id`",
      "abc>f",
      "abc<f",
      "abc(x)",
      "abc 'x'",
      'abc"x"',
      "abc def",
      "abc\0",
      "abc/def",
      "abc*",
    ]) {
      expect(isValidId(bad)).toBe(false);
    }
  });

  // Anchoring: an unanchored ID_RE would let `3f2a1b9c8d7e; rm -rf /` past.
  it("is anchored at both ends", () => {
    expect(isValidId("3f2a1b9c8d7e\nevil; id")).toBe(false);
    expect(isValidId("evil; id\n3f2a1b9c8d7e")).toBe(false);
    expect(isValidId("3f2a1b9c8d7e\n")).toBe(false);
  });

  // Leading char must be alphanumeric — this is what keeps `-rm`-style flag
  // injection and `..` traversal out of the id position.
  it("rejects a leading punctuation char", () => {
    expect(isValidId("-rm")).toBe(false);
    expect(isValidId("--force")).toBe(false);
    expect(isValidId("..")).toBe(false);
    expect(isValidId(".hidden")).toBe(false);
    expect(isValidId("_x")).toBe(false);
  });

  it("enforces the 128-char cap and rejects empty", () => {
    expect(isValidId("a".repeat(128))).toBe(true);
    expect(isValidId("a".repeat(129))).toBe(false);
    expect(isValidId("")).toBe(false);
  });

  it("rejects non-ASCII", () => {
    expect(isValidId("café")).toBe(false);
    expect(isValidId("контейнер")).toBe(false);
  });

  it("exports the regex used by the helper", () => {
    expect(ID_RE.test("3f2a1b9c8d7e")).toBe(true);
  });
});
