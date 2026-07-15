export type Server = {
  id: string;
  ownerId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: "password" | "key";
  hostFingerprint: string | null;
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
