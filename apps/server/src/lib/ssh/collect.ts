// Bounded stream collection for command output.
//
// Split out from client.ts so it can be tested with a fake stream — no host, no
// network. The cap is the whole point: remote output is unbounded and
// attacker-influenced (arbitrary SQL, `cat` of any file), and buffering it into
// a JS string is how a small panel dies.

import type { Readable } from "node:stream";

export type Collected = { text: string; truncated: boolean };

/**
 * Accumulate `stream` into a string, stopping at `cap` bytes.
 *
 * Once the cap is hit we stop appending and destroy the stream, so the remote
 * side stops sending rather than us silently draining it into the void.
 */
export function collectStream(
  stream: Readable,
  cap: number,
  onDone: (result: Collected) => void,
): void {
  const chunks: string[] = [];
  let bytes = 0;
  let truncated = false;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    onDone({ text: chunks.join(""), truncated });
  };

  stream.on("data", (d: Buffer) => {
    if (truncated) return;
    const remaining = cap - bytes;
    // `>` not `>=`: output that exactly fills the cap lost nothing, so flagging
    // it truncated would be a false positive. Only a byte we cannot keep counts.
    if (d.length > remaining) {
      // Slice the byte buffer, not the decoded string: `d.toString()` first
      // would materialise the very chunk we are trying not to hold.
      chunks.push(d.subarray(0, remaining).toString());
      bytes = cap;
      truncated = true;
      stream.destroy();
      finish();
      return;
    }
    bytes += d.length;
    chunks.push(d.toString());
  });

  stream.on("close", finish);
  stream.on("end", finish);
}
