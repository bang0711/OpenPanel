import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM encryption for SSH credentials at rest.
// Blob format: base64(iv).base64(authTag).base64(ciphertext)

function key(): Buffer {
  const k = Buffer.from(process.env.OPENPANEL_ENC_KEY ?? "", "base64");
  if (k.length !== 32) {
    throw new Error("OPENPANEL_ENC_KEY must be 32 bytes, base64-encoded");
  }
  return k;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ct].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(blob: string): string {
  const parts = blob.split(".");
  // Structure check, not a truthiness check: an empty plaintext encrypts to an
  // empty ciphertext segment, and `!ctB` would reject its own output.
  if (parts.length !== 3) throw new Error("Malformed encrypted blob");
  const [ivB, tagB, ctB] = parts;
  if (!ivB || !tagB) throw new Error("Malformed encrypted blob");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
