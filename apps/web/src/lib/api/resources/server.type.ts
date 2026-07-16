export type Server = {
  id: string;
  ownerId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: "password" | "key";
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
  tags?: string[];
};

export type TestResult = {
  ok: boolean;
  fingerprint: string;
  pinned: boolean;
};
