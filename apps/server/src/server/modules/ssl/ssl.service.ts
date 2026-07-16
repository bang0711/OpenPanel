import { runCommand, type SshServer } from "@/lib/ssh/client";

import { isValidDomain, isValidEmail } from "./ssl.constant";

export type SslCert = {
  name: string;
  domains: string[];
  expiry: string;
  valid: boolean;
};
export type SslStatus = { installed: boolean; certs: SslCert[] };

export class SslService {
  async list(server: SshServer): Promise<SslStatus> {
    const detect = await runCommand(
      server,
      "command -v certbot >/dev/null 2>&1 && echo yes || echo no",
    );
    if (detect.stdout.trim() !== "yes") {
      return { installed: false, certs: [] };
    }
    const { stdout } = await runCommand(
      server,
      "certbot certificates 2>/dev/null",
    );
    return { installed: true, certs: this.parseCerts(stdout) };
  }

  async issue(server: SshServer, domain: string, email: string) {
    if (!isValidDomain(domain)) throw new Error("Invalid domain");
    if (!isValidEmail(email)) throw new Error("Invalid email");
    return this.run(
      server,
      `certbot --nginx -n --agree-tos -m ${email} -d ${domain}`,
    );
  }

  renew(server: SshServer) {
    return this.run(server, "certbot renew");
  }

  private async run(server: SshServer, cmd: string) {
    const { stdout, stderr, code } = await runCommand(server, cmd);
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }

  private parseCerts(out: string): SslCert[] {
    const certs: SslCert[] = [];
    let cur: SslCert | null = null;
    for (const raw of out.split("\n")) {
      const line = raw.trim();
      const name = line.match(/^Certificate Name:\s*(.+)$/);
      if (name) {
        cur = { name: name[1].trim(), domains: [], expiry: "", valid: false };
        certs.push(cur);
        continue;
      }
      if (!cur) continue;
      const domains = line.match(/^Domains:\s*(.+)$/);
      if (domains) {
        cur.domains = domains[1].trim().split(/\s+/).filter(Boolean);
        continue;
      }
      const expiry = line.match(/^Expiry Date:\s*(.+)$/);
      if (expiry) {
        cur.expiry = expiry[1].trim();
        cur.valid = /VALID/i.test(expiry[1]) && !/INVALID/i.test(expiry[1]);
      }
    }
    return certs;
  }
}

export const sslService = new SslService();
