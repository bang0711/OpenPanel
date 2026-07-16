import { describe, expect, it } from "bun:test";

import { isValidUsername, SHELLS, USERNAME_RE } from "./users.constant";

// The username is interpolated into `useradd`/`userdel`/`usermod`, so anything
// this accepts runs on the remote host with root.
describe("isValidUsername", () => {
  it("accepts realistic system usernames", () => {
    for (const name of ["deploy", "www-data", "_apt", "user_1", "a"]) {
      expect(isValidUsername(name)).toBe(true);
    }
  });

  it("rejects shell metacharacters", () => {
    for (const name of [
      "deploy;id",
      "deploy|id",
      "deploy&id",
      "deploy$USER",
      "deploy$(id)",
      "deploy`id`",
      "deploy>out",
      "deploy<in",
      "deploy(x)",
      "de ploy",
      "'deploy'",
      '"deploy"',
      "deploy\\x",
    ]) {
      expect(isValidUsername(name)).toBe(false);
    }
  });

  it("rejects path traversal and slashes", () => {
    expect(isValidUsername("../root")).toBe(false);
    expect(isValidUsername("etc/passwd")).toBe(false);
  });

  // JS `$` (no /m) matches end-of-input only, so an appended payload — including
  // one hidden behind a newline or NUL — cannot slip past the anchor.
  it("is anchored: no prepended/appended/embedded payload survives", () => {
    expect(isValidUsername("deploy\nevil; id")).toBe(false);
    expect(isValidUsername("deploy\n")).toBe(false);
    expect(isValidUsername("\ndeploy")).toBe(false);
    expect(isValidUsername("deploy\r\nevil")).toBe(false);
    expect(isValidUsername("deploy\0evil")).toBe(false);
    expect(isValidUsername("evil id deploy")).toBe(false);
  });

  it("rejects an empty name and enforces the 32-char cap", () => {
    expect(isValidUsername("")).toBe(false);
    expect(isValidUsername(`a${"b".repeat(31)}`)).toBe(true); // 32 = limit
    expect(isValidUsername(`a${"b".repeat(32)}`)).toBe(false); // 33 = over
  });

  it("rejects names that do not start with a lowercase letter or underscore", () => {
    expect(isValidUsername("1deploy")).toBe(false);
    expect(isValidUsername("-deploy")).toBe(false);
    expect(isValidUsername("Deploy")).toBe(false);
  });

  it("rejects uppercase and unicode look-alikes", () => {
    expect(isValidUsername("rооt")).toBe(false); // Cyrillic о
    expect(isValidUsername("dépl")).toBe(false);
    expect(isValidUsername("ROOT")).toBe(false);
  });

  it("USERNAME_RE has no global flag (stateless across calls)", () => {
    expect(USERNAME_RE.global).toBe(false);
    expect(isValidUsername("deploy")).toBe(true);
    expect(isValidUsername("deploy")).toBe(true);
  });
});

describe("SHELLS", () => {
  it("is the exact allowlist", () => {
    expect([...SHELLS]).toEqual([
      "/bin/bash",
      "/bin/sh",
      "/usr/sbin/nologin",
      "/bin/false",
    ]);
  });

  it("rejects near-misses and injected variants", () => {
    for (const shell of [
      "/bin/bash ",
      "/bin/bash;id",
      "/bin/zsh",
      "/bin/BASH",
      "bin/bash",
      "/usr/bin/bash",
      "/bin/sh -c id",
    ]) {
      expect(SHELLS).not.toContain(shell as never);
    }
  });
});
