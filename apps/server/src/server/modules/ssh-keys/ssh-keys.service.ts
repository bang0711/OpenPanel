import { runCommand, runCommandInput, type SshServer } from "@/lib/ssh/client";

import { isValidPubkey } from "./ssh-keys.constant";

export type SshKey = { type: string; comment: string; preview: string };

const READ_CMD = "cat ~/.ssh/authorized_keys 2>/dev/null || true";
// Write the whole file back via stdin — the key content never touches the
// command string, so it can't be shell-interpolated.
const WRITE_CMD =
  "mkdir -p ~/.ssh && cat > ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys";

export class SshKeysService {
  async list(server: SshServer): Promise<{ keys: SshKey[]; count: number }> {
    const { stdout } = await runCommand(server, READ_CMD);
    const lines = stdout
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("#"));
    const keys = lines.map((line) => {
      const parts = line.split(/\s+/);
      const body = parts[1] ?? "";
      return {
        type: parts[0] ?? "",
        comment: parts.slice(2).join(" "),
        preview: body.slice(-12),
      };
    });
    return { keys, count: lines.length };
  }

  async add(server: SshServer, publicKey: string) {
    const line = publicKey.trim();
    if (!isValidPubkey(line)) throw new Error("Invalid public key");
    const current = (await runCommand(server, READ_CMD)).stdout;
    const body =
      (current.trim() ? current.replace(/\n*$/, "\n") : "") + line + "\n";
    return this.write(server, body);
  }

  async remove(server: SshServer, index: number) {
    const current = (await runCommand(server, READ_CMD)).stdout;
    let keyIdx = 0;
    const kept: string[] = [];
    for (const raw of current.split("\n")) {
      const line = raw.trim();
      const isKey = line.length > 0 && !line.startsWith("#");
      if (isKey) {
        if (keyIdx === index) {
          keyIdx++;
          continue; // drop this key line
        }
        keyIdx++;
      }
      kept.push(raw);
    }
    const body = kept.join("\n").replace(/\n*$/, "\n");
    return this.write(server, body);
  }

  private async write(server: SshServer, body: string) {
    const { stdout, stderr, code } = await runCommandInput(
      server,
      WRITE_CMD,
      body,
    );
    if (code !== 0)
      throw new Error(stderr.trim() || "Failed to write authorized_keys");
    return { ok: true, output: (stdout + stderr).trim() };
  }
}

export const sshKeysService = new SshKeysService();
