import { beforeAll, describe, expect, it } from "bun:test";
import { randomBytes } from "node:crypto";

import { decryptSecret, encryptSecret } from "./crypto";

const KEY = randomBytes(32).toString("base64");

beforeAll(() => {
  process.env.OPENPANEL_ENC_KEY = KEY;
});

// This is what protects SSH passwords and private keys at rest. A silent
// failure here means credentials are recoverable from a DB dump.
describe("encryptSecret / decryptSecret", () => {
  it("round-trips a secret", () => {
    expect(decryptSecret(encryptSecret("hunter2"))).toBe("hunter2");
  });

  it("round-trips an OpenSSH private key", () => {
    const key = `-----BEGIN OPENSSH PRIVATE KEY-----\n${"b3BlbnNzaC1rZXktdjEA".repeat(20)}\n-----END OPENSSH PRIVATE KEY-----`;
    expect(decryptSecret(encryptSecret(key))).toBe(key);
  });

  it("round-trips empty and unicode values", () => {
    expect(decryptSecret(encryptSecret(""))).toBe("");
    expect(decryptSecret(encryptSecret("mật khẩu 🔐"))).toBe("mật khẩu 🔐");
  });

  it("never produces the same ciphertext twice (random IV)", () => {
    const a = encryptSecret("same");
    const b = encryptSecret("same");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it("rejects a tampered ciphertext", () => {
    const [iv, tag, ct] = encryptSecret("hunter2").split(".");
    const flipped = Buffer.from(ct, "base64");
    flipped[0] ^= 0xff;
    const blob = [iv, tag, flipped.toString("base64")].join(".");
    expect(() => decryptSecret(blob)).toThrow();
  });

  it("rejects a tampered auth tag", () => {
    const [iv, tag, ct] = encryptSecret("hunter2").split(".");
    const flipped = Buffer.from(tag, "base64");
    flipped[0] ^= 0xff;
    expect(() => decryptSecret([iv, flipped.toString("base64"), ct].join("."))).toThrow();
  });

  it("rejects a malformed blob", () => {
    expect(() => decryptSecret("")).toThrow("Malformed encrypted blob");
    expect(() => decryptSecret("only-one-part")).toThrow("Malformed encrypted blob");
    expect(() => decryptSecret("two.parts")).toThrow("Malformed encrypted blob");
  });

  it("cannot decrypt with a different key", () => {
    const blob = encryptSecret("hunter2");
    process.env.OPENPANEL_ENC_KEY = randomBytes(32).toString("base64");
    try {
      expect(() => decryptSecret(blob)).toThrow();
    } finally {
      process.env.OPENPANEL_ENC_KEY = KEY;
    }
  });

  it("refuses a key that is not 32 bytes", () => {
    process.env.OPENPANEL_ENC_KEY = randomBytes(16).toString("base64");
    try {
      expect(() => encryptSecret("x")).toThrow("must be 32 bytes");
    } finally {
      process.env.OPENPANEL_ENC_KEY = KEY;
    }
  });

  it("refuses a missing key", () => {
    delete process.env.OPENPANEL_ENC_KEY;
    try {
      expect(() => encryptSecret("x")).toThrow("must be 32 bytes");
    } finally {
      process.env.OPENPANEL_ENC_KEY = KEY;
    }
  });
});
