import { describe, expect, it } from "bun:test";

import { parseOsRelease, planServerUpdate } from "./servers.constant";

const current = { host: "10.0.0.1", port: 22, authType: "password" };

// Pure planner for an edit: decides which columns change, whether the pinned
// host key must be dropped, and guards the auth-type switch.
describe("planServerUpdate", () => {
  it("only includes provided plain fields", () => {
    const plan = planServerUpdate({ name: "renamed" }, current);
    expect(plan.fields).toEqual({ name: "renamed" });
    expect(plan.resetPin).toBe(false);
    expect(plan.error).toBeNull();
  });

  it("empty body updates nothing and keeps the pin", () => {
    const plan = planServerUpdate({}, current);
    expect(plan.fields).toEqual({});
    expect(plan.resetPin).toBe(false);
    expect(plan.setSecret).toBe(false);
    expect(plan.setPassphrase).toBe("keep");
  });

  it("host change forces a re-pin", () => {
    expect(planServerUpdate({ host: "10.0.0.2" }, current).resetPin).toBe(true);
  });

  it("port change forces a re-pin", () => {
    expect(planServerUpdate({ port: 2222 }, current).resetPin).toBe(true);
  });

  it("host/port set to the SAME value does not re-pin", () => {
    const plan = planServerUpdate({ host: "10.0.0.1", port: 22 }, current);
    expect(plan.resetPin).toBe(false);
  });

  it("rejects an auth-type switch with no new secret", () => {
    const plan = planServerUpdate({ authType: "key" }, current);
    expect(plan.error).not.toBeNull();
    expect(plan.setSecret).toBe(false);
  });

  it("allows an auth-type switch when a secret is supplied", () => {
    const plan = planServerUpdate({ authType: "key", secret: "k" }, current);
    expect(plan.error).toBeNull();
    expect(plan.setSecret).toBe(true);
    expect(plan.fields.authType).toBe("key");
  });

  it("same auth type without a secret is fine and does not rotate it", () => {
    const plan = planServerUpdate({ authType: "password" }, current);
    expect(plan.error).toBeNull();
    expect(plan.setSecret).toBe(false);
  });

  it("passphrase: absent keeps, empty string clears, value sets", () => {
    expect(planServerUpdate({}, current).setPassphrase).toBe("keep");
    expect(planServerUpdate({ passphrase: "" }, current).setPassphrase).toBe(
      "clear",
    );
    expect(planServerUpdate({ passphrase: "p" }, current).setPassphrase).toBe(
      "set",
    );
  });

  it("a provided secret alone (no auth-type change) rotates the credential", () => {
    const plan = planServerUpdate({ secret: "newpass" }, current);
    expect(plan.setSecret).toBe(true);
    expect(plan.error).toBeNull();
  });
});

// /etc/os-release is text a remote host controls, so `osId` is allowlisted and
// `osName` is sanitised before it can reach the UI.
describe("parseOsRelease", () => {
  it("parses a real Debian os-release", () => {
    const out = parseOsRelease(
      [
        'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"',
        'NAME="Debian GNU/Linux"',
        'VERSION_ID="12"',
        "ID=debian",
      ].join("\n"),
    );
    expect(out.osId).toBe("debian");
    expect(out.osName).toBe("Debian GNU/Linux 12 (bookworm)");
  });

  it("parses Ubuntu and ignores ID_LIKE", () => {
    const out = parseOsRelease(
      'NAME="Ubuntu"\nID=ubuntu\nID_LIKE=debian\nPRETTY_NAME="Ubuntu 24.04.1 LTS"',
    );
    expect(out.osId).toBe("ubuntu");
    expect(out.osName).toBe("Ubuntu 24.04.1 LTS");
  });

  it("falls back to NAME when PRETTY_NAME is absent", () => {
    const out = parseOsRelease('NAME="Alpine Linux"\nID=alpine');
    expect(out.osId).toBe("alpine");
    expect(out.osName).toBe("Alpine Linux");
  });

  it("is case- and quote-insensitive for ID", () => {
    expect(parseOsRelease("ID='DEBIAN'").osId).toBe("debian");
  });

  it("returns null for an empty or missing file", () => {
    expect(parseOsRelease("")).toEqual({ osId: null, osName: null });
  });

  it("returns a null osId for an unknown distro but keeps the name", () => {
    const out = parseOsRelease('ID=plan9\nPRETTY_NAME="Plan 9"');
    expect(out.osId).toBeNull();
    expect(out.osName).toBe("Plan 9");
  });

  it("rejects an id that is not on the allowlist", () => {
    expect(parseOsRelease("ID=debian evil").osId).toBeNull();
    expect(parseOsRelease("ID=../../etc/passwd").osId).toBeNull();
  });

  it("caps a hostile PRETTY_NAME", () => {
    const out = parseOsRelease(`ID=debian\nPRETTY_NAME="${"X".repeat(500)}"`);
    expect(out.osName!.length).toBeLessThanOrEqual(64);
  });

  it("strips control characters from PRETTY_NAME", () => {
    const out = parseOsRelease(
      `ID=debian\nPRETTY_NAME="Deb${String.fromCharCode(7, 27, 127)}ian"`,
    );
    expect(out.osName).toBe("Debian");
  });
});
