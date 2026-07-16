import { describe, expect, it } from "bun:test";

import { isValidPubkey, PUBKEY_RE } from "./ssh-keys.constant";

const BODY = "AAAAC3NzaC1lZDI1NTE5AAAAIL8kFqWJ9PQvXk3mZ2Rn4tYbCd5eFg6hIj7kLm8nOpQr";
const ED25519 = `ssh-ed25519 ${BODY} user@host`;

describe("isValidPubkey", () => {
  it("accepts real public keys", () => {
    expect(isValidPubkey(ED25519)).toBe(true);
    expect(isValidPubkey("ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC7vbq== bob@laptop")).toBe(true);
    expect(isValidPubkey("ssh-dss AAAAB3NzaC1kc3M")).toBe(true); // comment optional
    expect(
      isValidPubkey("ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTY= a@b"),
    ).toBe(true);
    expect(
      isValidPubkey("sk-ssh-ed25519@openssh.com AAAAGnNrLXNzaC1lZDI1NTE5 yubikey"),
    ).toBe(true);
    expect(isValidPubkey("sk-ecdsa-sha2-nistp256@openssh.com AAAAInNr= k")).toBe(true);
  });

  it("accepts a multi-word comment and surrounding whitespace", () => {
    expect(isValidPubkey(`ssh-ed25519 ${BODY} work laptop 2024`)).toBe(true);
    expect(isValidPubkey(`  ssh-ed25519 ${BODY} user@host  `)).toBe(true);
  });

  // THE case that matters: this text is appended to authorized_keys. A newline
  // in it would append a SECOND authorized key — silent, permanent backdoor.
  it("rejects embedded newlines (authorized_keys line injection)", () => {
    expect(isValidPubkey(`${ED25519}\nssh-rsa AAAAB3Nza attacker@evil`)).toBe(false);
    expect(isValidPubkey(`${ED25519}\r\nssh-rsa AAAAB3Nza attacker@evil`)).toBe(false);
    expect(isValidPubkey(`${ED25519}\n`)).toBe(false);
    expect(isValidPubkey(`\n${ED25519}`)).toBe(false);
    expect(isValidPubkey(`${ED25519}\r`)).toBe(false);
    // A lone \r would also start a new line in most authorized_keys parsers.
    expect(isValidPubkey(`ssh-ed25519 ${BODY}\rssh-rsa AAAA evil`)).toBe(false);
  });

  it("rejects an unknown or malformed key type", () => {
    expect(isValidPubkey(`ssh-evil ${BODY} user@host`)).toBe(false);
    expect(isValidPubkey(`rsa ${BODY} user@host`)).toBe(false);
    expect(isValidPubkey(`${BODY} user@host`)).toBe(false); // no type
    expect(isValidPubkey("ssh-ed25519")).toBe(false); // no body
    expect(isValidPubkey("")).toBe(false);
    expect(isValidPubkey("   ")).toBe(false);
  });

  it("rejects a body that is not plain base64", () => {
    expect(isValidPubkey("ssh-ed25519 AAAA$(id) user@host")).toBe(false);
    expect(isValidPubkey("ssh-ed25519 AAAA;id user@host")).toBe(false);
    expect(isValidPubkey("ssh-ed25519 AAAA`id` user@host")).toBe(false);
    expect(isValidPubkey("ssh-ed25519 AAAA|id user@host")).toBe(false);
    expect(isValidPubkey("ssh-ed25519 ../../etc/passwd user@host")).toBe(false);
    expect(isValidPubkey("ssh-ed25519 AAA=BBB user@host")).toBe(false); // `=` only pads
  });

  it("rejects a NUL byte anywhere", () => {
    expect(isValidPubkey(`ssh-ed25519 ${BODY}\0 user@host`)).toBe(false);
    expect(isValidPubkey(`ssh-ed25519\0 ${BODY}`)).toBe(false);
  });

  // authorized_keys options (`command=`, `from=`) would change what the key can
  // do — the regex only allows a bare `<type> <body> [comment]` line.
  it("rejects an authorized_keys options prefix", () => {
    expect(isValidPubkey(`command="/bin/sh" ssh-ed25519 ${BODY}`)).toBe(false);
    expect(isValidPubkey(`no-pty,from="*" ${ED25519}`)).toBe(false);
  });

  // Anchoring check: junk before the type is rejected (above), and junk after
  // the body can only land in the comment field, which is inert text.
  it("keeps trailing junk confined to the comment field", () => {
    expect(isValidPubkey(`ssh-ed25519 ${BODY} user@host; rm -rf /`)).toBe(true);
    // Safe only because ssh-keys.service.ts writes the file via `cat >` stdin,
    // never via shell interpolation. A future caller that interpolates the
    // whole line into a command would inherit an injection from this comment.
  });

  // BUG: the `ecdsa-sha2-\S+` / `sk-ecdsa-sha2-\S+` alternatives use `\S+`, so
  // any non-space garbage passes as a curve name (ssh-keys.constant.ts:6).
  // Not currently exploitable (stdin write, and sshd rejects the line), but the
  // type field should be an allowlist of real curves, not `\S+`.
  it("accepts an arbitrary ecdsa curve suffix", () => {
    expect(isValidPubkey(`ecdsa-sha2-$(id) ${BODY} user@host`)).toBe(true);
    expect(isValidPubkey(`ecdsa-sha2-;rm${BODY} ${BODY}`)).toBe(true);
  });

  it("exports the regex used by the helper", () => {
    expect(PUBKEY_RE.test(ED25519)).toBe(true);
  });
});
