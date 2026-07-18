import {
  runCommand,
  runPrivileged,
  runPrivilegedInput,
  type SshServer,
} from "@/lib/ssh/client";

import { normalizeRemotePath } from "../files/files.constant";
import { isAllowedZonePath, isValidZoneName } from "./dns.constant";

export type DnsStatus = { installed: boolean; zones: string[] };

export class DnsService {
  async list(server: SshServer): Promise<DnsStatus> {
    const detect = await runCommand(
      server,
      "command -v named-checkzone >/dev/null 2>&1 || command -v named >/dev/null 2>&1 && echo yes || echo no",
    );
    if (detect.stdout.trim() !== "yes") {
      return { installed: false, zones: [] };
    }
    const out = await runPrivileged(
      server,
      "ls -1 /etc/bind/db.* /etc/bind/zones/* 2>/dev/null; ls -1 /var/named/*.zone 2>/dev/null",
    );
    return { installed: true, zones: this.lines(out.stdout) };
  }

  async read(server: SshServer, path: string) {
    // Escalated cat, not SFTP: zone files are root-owned. `safe` is validated
    // (allowed dirs + normalize) and can't contain a quote.
    const safe = this.assertPath(path);
    const { stdout } = await runPrivileged(server, `cat '${safe}'`);
    return { content: stdout };
  }

  async write(server: SshServer, path: string, content: string, zoneName?: string) {
    const safe = this.assertPath(path);
    // Escalated tee (content over stdin) instead of an SFTP write.
    const w = await runPrivilegedInput(server, `tee '${safe}' >/dev/null`, content);
    if (w.code !== 0) {
      return { ok: false, output: (w.stderr || w.stdout).trim() };
    }

    // No zone name to validate against — just write, no check/reload.
    if (!zoneName) return { ok: true, output: "" };
    if (!isValidZoneName(zoneName)) throw new Error("Invalid zone name");

    const check = await runPrivileged(
      server,
      `named-checkzone ${zoneName} ${safe}`,
    );
    const output = (check.stderr || check.stdout).trim();
    // Never reload BIND with a zone that fails validation.
    if (check.code !== 0) return { ok: false, output };

    await runPrivileged(
      server,
      "rndc reload 2>/dev/null || systemctl reload named 2>/dev/null || systemctl reload bind9 2>/dev/null",
    );
    return { ok: true, output };
  }

  private assertPath(path: string): string {
    const safe = normalizeRemotePath(path);
    if (!isAllowedZonePath(safe)) throw new Error("Path not allowed");
    return safe;
  }

  private lines(out: string): string[] {
    return out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }
}

export const dnsService = new DnsService();
