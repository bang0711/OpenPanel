import { runCommand, type SshServer } from "@/lib/ssh/client";

import {
  FW_ACTIONS,
  FW_PROTOCOLS,
  type FwAction,
  type FwProtocol,
  isValidPort,
} from "./firewall.constant";

export type FwRule = { num: number; to: string; action: string; from: string };
export type FwStatus = {
  installed: boolean;
  active: boolean;
  rules: FwRule[];
};

export class FirewallService {
  async status(server: SshServer): Promise<FwStatus> {
    const detect = await runCommand(
      server,
      "command -v ufw >/dev/null 2>&1 && echo yes || echo no",
    );
    if (detect.stdout.trim() !== "yes") {
      return { installed: false, active: false, rules: [] };
    }
    const { stdout } = await runCommand(
      server,
      "ufw status numbered 2>/dev/null",
    );
    return {
      installed: true,
      active: /Status:\s*active/i.test(stdout),
      rules: this.parseRules(stdout),
    };
  }

  async setRule(
    server: SshServer,
    action: FwAction,
    port: number,
    protocol?: FwProtocol,
  ) {
    if (!FW_ACTIONS.includes(action)) throw new Error("Invalid action");
    if (!isValidPort(port)) throw new Error("Invalid port");
    if (protocol && !FW_PROTOCOLS.includes(protocol))
      throw new Error("Invalid protocol");
    const target = protocol ? `${port}/${protocol}` : `${port}`;
    return this.run(server, `ufw ${action} ${target}`);
  }

  async deleteRule(server: SshServer, num: number) {
    if (!Number.isInteger(num) || num < 1) throw new Error("Invalid rule");
    return this.run(server, `ufw --force delete ${num}`);
  }

  enable(server: SshServer) {
    return this.run(server, "ufw --force enable");
  }

  disable(server: SshServer) {
    return this.run(server, "ufw disable");
  }

  private async run(server: SshServer, cmd: string) {
    const { stdout, stderr, code } = await runCommand(server, cmd);
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }

  private parseRules(out: string): FwRule[] {
    const rules: FwRule[] = [];
    const re = /^\[\s*(\d+)\]\s+(.+?)\s+(ALLOW|DENY|REJECT|LIMIT)\s+(?:IN|OUT)?\s*(.*)$/;
    for (const raw of out.split("\n")) {
      const m = raw.trim().match(re);
      if (m) {
        rules.push({
          num: parseInt(m[1], 10),
          to: m[2].trim(),
          action: m[3],
          from: m[4].trim() || "Anywhere",
        });
      }
    }
    return rules;
  }
}

export const firewallService = new FirewallService();
