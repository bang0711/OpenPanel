import { runCommand, runPrivileged, type SshServer } from "@/lib/ssh/client";

import { isValidIp, isValidJail } from "./fail2ban.constant";

export type F2bJail = { name: string; banned: string[] };
export type F2bStatus = {
  installed: boolean;
  jails: F2bJail[];
};

export class Fail2banService {
  async status(server: SshServer): Promise<F2bStatus> {
    const detect = await runCommand(
      server,
      "command -v fail2ban-client >/dev/null 2>&1 && echo yes || echo no",
    );
    if (detect.stdout.trim() !== "yes") {
      return { installed: false, jails: [] };
    }

    const { stdout } = await runPrivileged(
      server,
      "fail2ban-client status 2>/dev/null",
    );
    const names = this.parseJailList(stdout);

    const jails: F2bJail[] = [];
    for (const name of names) {
      if (!isValidJail(name)) continue;
      const res = await runPrivileged(
        server,
        `fail2ban-client status ${name} 2>/dev/null`,
      );
      jails.push({ name, banned: this.parseBannedIps(res.stdout) });
    }
    return { installed: true, jails };
  }

  async unban(server: SshServer, jail: string, ip: string) {
    if (!isValidJail(jail)) throw new Error("Invalid jail");
    if (!isValidIp(ip)) throw new Error("Invalid IP");
    const { stdout, stderr, code } = await runPrivileged(
      server,
      `fail2ban-client set ${jail} unbanip ${ip}`,
    );
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }

  private parseJailList(out: string): string[] {
    const m = out.match(/Jail list:\s*(.*)/i);
    if (!m) return [];
    return m[1]
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  private parseBannedIps(out: string): string[] {
    const m = out.match(/Banned IP list:\s*(.*)/i);
    if (!m) return [];
    return m[1]
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

export const fail2banService = new Fail2banService();
