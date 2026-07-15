import { createHash } from "node:crypto";
import { Client, type ConnectConfig } from "ssh2";

import { decryptSecret } from "@/lib/crypto";

// Minimal structural shape of a stored server (subset of the Prisma model).
export type SshServer = {
  host: string;
  port: number;
  username: string;
  authType: string; // 'password' | 'key'
  secretEnc: string;
  passphraseEnc?: string | null;
  hostFingerprint?: string | null;
};

export type ExecResult = { stdout: string; stderr: string; code: number | null };

function fingerprintOf(key: Buffer): string {
  return createHash("sha256").update(key).digest("base64");
}

export function buildConfig(
  server: SshServer,
  onFingerprint?: (fp: string) => void,
): ConnectConfig {
  const secret = decryptSecret(server.secretEnc);

  const cfg: ConnectConfig = {
    host: server.host,
    port: server.port,
    username: server.username,
    readyTimeout: 15_000,
    // TOFU host-key verification: pin on first connect, enforce thereafter.
    hostVerifier: (key: Buffer) => {
      const fp = fingerprintOf(key);
      onFingerprint?.(fp);
      if (server.hostFingerprint) return server.hostFingerprint === fp;
      return true; // first connect: accept and let the caller pin `fp`
    },
  };

  if (server.authType === "password") {
    cfg.password = secret;
  } else {
    cfg.privateKey = secret;
    if (server.passphraseEnc) cfg.passphrase = decryptSecret(server.passphraseEnc);
  }

  return cfg;
}

// --- Connection pool ---
// Reuse one live SSH connection per host (ssh2 multiplexes exec/sftp channels),
// so polling endpoints don't pay a TCP+SSH handshake on every request. Idle
// connections are evicted after IDLE_MS. Terminal/testConnection stay one-off.
type Pooled = { client: Client; refs: number; idle?: ReturnType<typeof setTimeout> };
const pool = new Map<string, Pooled>();
const IDLE_MS = 60_000;

function poolKey(s: SshServer): string {
  return `${s.username}@${s.host}:${s.port}`;
}

function acquire(server: SshServer): Promise<Client> {
  const key = poolKey(server);
  const existing = pool.get(key);
  if (existing) {
    existing.refs++;
    if (existing.idle) {
      clearTimeout(existing.idle);
      existing.idle = undefined;
    }
    return Promise.resolve(existing.client);
  }
  return new Promise((resolve, reject) => {
    const client = new Client();
    const entry: Pooled = { client, refs: 1 };
    client
      .on("ready", () => {
        pool.set(key, entry);
        resolve(client);
      })
      .on("error", (err) => {
        pool.delete(key);
        reject(err);
      })
      .on("close", () => pool.delete(key))
      .connect({ ...buildConfig(server), keepaliveInterval: 15_000 });
  });
}

function release(server: SshServer): void {
  const key = poolKey(server);
  const entry = pool.get(key);
  if (!entry) return;
  entry.refs = Math.max(0, entry.refs - 1);
  if (entry.refs === 0) {
    entry.idle = setTimeout(() => {
      pool.delete(key);
      try {
        entry.client.end();
      } catch {
        /* ignore */
      }
    }, IDLE_MS);
  }
}

/** Run `fn` over a pooled connection, borrowing/returning it around the call. */
export async function withSSH<T>(
  server: SshServer,
  fn: (conn: Client) => Promise<T>,
): Promise<T> {
  const conn = await acquire(server);
  try {
    return await fn(conn);
  } finally {
    release(server);
  }
}

/** Run a single command over an existing connection. Never interpolate user input into `cmd`. */
export function execCommand(conn: Client, cmd: string): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream
        .on("close", (code: number | null) => resolve({ stdout, stderr, code }))
        .on("data", (d: Buffer) => (stdout += d.toString()))
        .stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    });
  });
}

/** Convenience: open a connection just to run one command. */
export function runCommand(server: SshServer, cmd: string): Promise<ExecResult> {
  return withSSH(server, (conn) => execCommand(conn, cmd));
}

/** Run a command, feeding `input` to its stdin (e.g. `crontab -`). Avoids
 *  interpolating user content into the shell command itself. */
export function execInput(
  conn: Client,
  cmd: string,
  input: string,
): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stdout = "";
      let stderr = "";
      stream
        .on("close", (code: number | null) => resolve({ stdout, stderr, code }))
        .on("data", (d: Buffer) => (stdout += d.toString()))
        .stderr.on("data", (d: Buffer) => (stderr += d.toString()));
      stream.end(input);
    });
  });
}

export function runCommandInput(
  server: SshServer,
  cmd: string,
  input: string,
): Promise<ExecResult> {
  return withSSH(server, (conn) => execInput(conn, cmd, input));
}

/** Connect once to verify reachability + capture the host-key fingerprint (for pinning). */
export function testConnection(
  server: SshServer,
): Promise<{ ok: boolean; fingerprint: string }> {
  return new Promise((resolve, reject) => {
    let fingerprint = "";
    const conn = new Client();
    conn
      .on("ready", () => {
        conn.end();
        resolve({ ok: true, fingerprint });
      })
      .on("error", reject)
      .connect(buildConfig(server, (fp) => (fingerprint = fp)));
  });
}
