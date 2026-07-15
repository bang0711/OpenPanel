// SSH public-key validation. We forbid newlines so a value can't inject extra
// lines into authorized_keys, and we write the file via `cat >` stdin rather
// than shell interpolation. Format: <type> <base64 body> [optional comment].

export const PUBKEY_RE =
  /^(ssh-rsa|ssh-ed25519|ssh-dss|ecdsa-sha2-\S+|sk-ssh-ed25519@openssh\.com|sk-ecdsa-sha2-\S+)\s+[A-Za-z0-9+/]+={0,3}(\s+\S.*)?$/;

export function isValidPubkey(line: string): boolean {
  if (line.includes("\n") || line.includes("\r")) return false;
  return PUBKEY_RE.test(line.trim());
}
