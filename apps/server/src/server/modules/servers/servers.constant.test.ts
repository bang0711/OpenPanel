import { describe, expect, it } from "bun:test";

import { parseOsRelease } from "./servers.constant";

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
