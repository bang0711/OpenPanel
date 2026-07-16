import { createHash } from "node:crypto";

import { collectStream } from "./collect";
import { ConnectionPool } from "./pool";
import { Client, type ClientChannel, type ConnectConfig } from "ssh2";

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

export type ExecResult = {
  stdout: string;
  stderr: string;
  code: number | null;
  /** True when output hit MAX_OUTPUT_BYTES and the rest was discarded. */
  truncated?: boolean;
};

/**
 * Hard cap on the output we buffer from one command. Without it a single
 * `SELECT * FROM big_table` (query console) or an unbounded `cat` pulls the
 * whole remote payload into memory and can OOM a 512MB panel. Callers that need
 * more than this should stream instead.
 */
export const MAX_OUTPUT_BYTES = 5 * 1024 * 1024;

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
// Bookkeeping lives in ./pool.ts so it can be tested without a host.
const IDLE_MS = 60_000;

// The server for a key is fixed on first dial; later acquires of the same
// user@host:port reuse that connection, so the config is captured here.
const pending = new Map<string, SshServer>();

const pool = new ConnectionPool<Client>((key, onGone) => {
  const server = pending.get(key)!;
  const client = new Client();
  const ready = new Promise<Client>((resolve, reject) => {
    client
      .on("ready", () => resolve(client))
      .on("error", (err) => {
        onGone();
        reject(err);
      })
      .on("close", onGone)
      .connect({ ...buildConfig(server), keepaliveInterval: 15_000 });
  });
  return { client, ready };
}, IDLE_MS);

function poolKey(s: SshServer): string {
  return `${s.username}@${s.host}:${s.port}`;
}

/** Run `fn` over a pooled connection, borrowing/returning it around the call. */
export async function withSSH<T>(
  server: SshServer,
  fn: (conn: Client) => Promise<T>,
): Promise<T> {
  const key = poolKey(server);
  pending.set(key, server);
  // Release the exact entry we borrowed: if the connection dropped mid-call and
  // a replacement took the key, decrementing by key alone would hit the wrong one.
  const entry = await pool.acquire(key);
  try {
    return await fn(entry.client);
  } finally {
    pool.release(key, entry);
  }
}

/**
 * Wire a command stream up to bounded collectors and resolve when it closes.
 * Shared by execCommand/execInput so the output cap cannot be forgotten in one
 * of them — every module goes through these two functions.
 */
function collectExec(
  stream: ClientChannel,
  resolve: (r: ExecResult) => void,
): void {
  let stdout = "";
  let stderr = "";
  let truncated = false;
  let code: number | null = null;
  let closed = false;
  let pendingStreams = 2;

  const settle = () => {
    if (closed && pendingStreams <= 0) resolve({ stdout, stderr, code, truncated });
  };

  collectStream(stream, MAX_OUTPUT_BYTES, (r) => {
    stdout = r.text;
    truncated ||= r.truncated;
    pendingStreams--;
    settle();
  });
  collectStream(stream.stderr, MAX_OUTPUT_BYTES, (r) => {
    stderr = r.text;
    truncated ||= r.truncated;
    pendingStreams--;
    settle();
  });

  stream.on("close", (c: number | null) => {
    code = c;
    closed = true;
    settle();
  });
}

/** Run a single command over an existing connection. Never interpolate user input into `cmd`. */
export function execCommand(conn: Client, cmd: string): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      collectExec(stream, resolve);
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
      collectExec(stream, resolve);
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
