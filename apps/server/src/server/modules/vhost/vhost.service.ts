import {
  runCommand,
  runPrivileged,
  runPrivilegedInput,
  type SshServer,
} from "@/lib/ssh/client";

import { normalizeRemotePath } from "../files/files.constant";
import {
  isValidSite,
  MAX_CONFIG_BYTES,
  SITES_AVAILABLE,
  SITES_ENABLED,
} from "./vhost.constant";

export type VhostSite = { name: string; enabled: boolean };
export type VhostStatus = { installed: boolean; sites: VhostSite[] };

export class VhostService {
  async status(server: SshServer): Promise<VhostStatus> {
    const detect = await runCommand(
      server,
      "command -v nginx >/dev/null 2>&1 && echo yes || echo no",
    );
    if (detect.stdout.trim() !== "yes") {
      return { installed: false, sites: [] };
    }
    const [available, enabled] = await Promise.all([
      runPrivileged(server, `ls -1 ${SITES_AVAILABLE} 2>/dev/null`),
      runPrivileged(server, `ls -1 ${SITES_ENABLED} 2>/dev/null`),
    ]);
    const enabledSet = new Set(this.lines(enabled.stdout));
    const sites = this.lines(available.stdout)
      .map((name) => ({ name, enabled: enabledSet.has(name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { installed: true, sites };
  }

  async read(server: SshServer, name: string) {
    this.assertSite(name);
    // Escalated cat, not SFTP: /etc/nginx is root-owned, and sudo can't elevate
    // an SFTP transfer. `path` is validated (isValidSite + normalize) and can't
    // contain a quote, so single-quoting makes the interpolation shell-safe.
    const path = normalizeRemotePath(`${SITES_AVAILABLE}/${name}`);
    const { stdout } = await runPrivileged(server, `cat '${path}'`);
    return { content: stdout };
  }

  async write(server: SshServer, name: string, content: string) {
    this.assertSite(name);
    if (Buffer.byteLength(content, "utf8") > MAX_CONFIG_BYTES) {
      throw new Error("Config too large (max 64 KB)");
    }
    const path = normalizeRemotePath(`${SITES_AVAILABLE}/${name}`);
    // Escalated tee (content over stdin, never argv) instead of an SFTP write.
    const res = await runPrivilegedInput(
      server,
      `tee '${path}' >/dev/null`,
      content,
    );
    if (res.code !== 0) {
      return { ok: false, output: (res.stderr || res.stdout).trim() };
    }
    // Validate but never reload here — a bad config must not touch a live nginx.
    return this.run(server, "nginx -t");
  }

  enable(server: SshServer, name: string) {
    this.assertSite(name);
    return this.run(
      server,
      `ln -sf ${SITES_AVAILABLE}/${name} ${SITES_ENABLED}/${name} && nginx -t && systemctl reload nginx`,
    );
  }

  disable(server: SshServer, name: string) {
    this.assertSite(name);
    return this.run(
      server,
      `rm -f ${SITES_ENABLED}/${name} && nginx -t && systemctl reload nginx`,
    );
  }

  private assertSite(name: string) {
    if (!isValidSite(name)) throw new Error("Invalid site name");
  }

  private lines(out: string): string[] {
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  private async run(server: SshServer, cmd: string) {
    const { stdout, stderr, code } = await runPrivileged(server, cmd);
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }
}

export const vhostService = new VhostService();
