export type Server = {
  id: string;
  ownerId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: "password" | "key";
  /** How the SSH user reaches root: 'none' (root) | 'nopasswd' | 'password'.
   *  Null until the server is tested. */
  sudoMode: string | null;
  hostFingerprint: string | null;
  /** /etc/os-release ID, e.g. "debian". Null until the server is tested. */
  osId: string | null;
  /** /etc/os-release PRETTY_NAME, e.g. "Debian GNU/Linux 12 (bookworm)". */
  osName: string | null;
  tags: string[];
  createdAt: string;
};

export type ServerCreateInput = {
  name: string;
  host: string;
  port?: number;
  username: string;
  authType: "password" | "key";
  secret: string;
  passphrase?: string;
  /** Optional sudo password. Omit to reuse the login password (password auth)
   *  or rely on root / passwordless sudo. */
  sudoPassword?: string;
  tags?: string[];
};

// Edit: every field optional. secret/passphrase omitted keep the stored
// credentials — the server never returns them, so blank means "unchanged".
export type ServerUpdateInput = {
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  authType?: "password" | "key";
  secret?: string;
  passphrase?: string;
  sudoPassword?: string;
  tags?: string[];
};

export type TestResult = {
  ok: boolean;
  fingerprint: string;
  pinned: boolean;
};
