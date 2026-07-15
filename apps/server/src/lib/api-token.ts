import { createHash, randomBytes } from "crypto";

// Personal API tokens: opaque random string shown once; only the hash is stored.
export function generateToken(): string {
  return "op_" + randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
