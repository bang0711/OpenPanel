import type { ServerUpdateInput } from "@/lib/api";

/**
 * Build the PATCH body from the edit form. Credentials are omitted when blank so
 * an unchanged field never overwrites the stored secret ("blank = keep"). The
 * auth type is always sent; the backend rejects a type switch that arrives
 * without a new secret.
 */
export function buildServerUpdate(v: {
  name: string;
  host: string;
  port: number;
  username: string;
  tags: string;
  authType: "password" | "key";
  password: string;
  keyText: string;
  passphrase: string;
  sudoPassword: string;
}): ServerUpdateInput {
  const secret = v.authType === "password" ? v.password : v.keyText;
  const out: ServerUpdateInput = {
    name: v.name,
    host: v.host,
    port: v.port,
    username: v.username,
    authType: v.authType,
    tags: v.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  if (secret) out.secret = secret;
  // Passphrase only applies to a key, and blank means "leave it as-is".
  if (v.authType === "key" && v.passphrase) out.passphrase = v.passphrase;
  // Sudo password: blank = keep current.
  if (v.sudoPassword) out.sudoPassword = v.sudoPassword;
  return out;
}
