import {
  runCommand,
  runPrivileged,
  runPrivilegedInput,
  type SshServer,
} from "@/lib/ssh/client";

import { normalizeRemotePath } from "../files/files.constant";
import {
  isValidDomain,
  isValidHost,
  isValidName,
  isValidPort,
  MARKER,
  SITES_AVAILABLE,
  SITES_ENABLED,
} from "./proxy.constant";

export type ProxyEntry = {
  name: string;
  serverName: string;
  upstream: string;
  enabled: boolean;
};
export type ProxyStatus = { installed: boolean; proxies: ProxyEntry[] };

export class ProxyService {
  async status(server: SshServer): Promise<ProxyStatus> {
    const detect = await runCommand(
      server,
      "command -v nginx >/dev/null 2>&1 && echo yes || echo no",
    );
    if (detect.stdout.trim() !== "yes") {
      return { installed: false, proxies: [] };
    }
    // Fixed dir path (no user input) — grep our marker to find managed sites.
    const [marked, enabled] = await Promise.all([
      runPrivileged(
        server,
        `grep -l -F '${MARKER}' ${SITES_AVAILABLE}/* 2>/dev/null`,
      ),
      runPrivileged(server, `ls -1 ${SITES_ENABLED} 2>/dev/null`),
    ]);
    const enabledSet = new Set(this.lines(enabled.stdout));
    const names = this.lines(marked.stdout).map((p) => p.slice(p.lastIndexOf("/") + 1));

    const proxies = await Promise.all(
      names.map((name) => this.parse(server, name, enabledSet.has(name))),
    );
    proxies.sort((a, b) => a.name.localeCompare(b.name));
    return { installed: true, proxies };
  }

  async create(
    server: SshServer,
    input: {
      name: string;
      serverName: string;
      upstreamHost: string;
      upstreamPort: number;
    },
  ) {
    const { name, serverName, upstreamHost, upstreamPort } = input;
    if (!isValidName(name)) throw new Error("Invalid site name");
    if (!isValidDomain(serverName)) throw new Error("Invalid server name");
    if (!isValidHost(upstreamHost)) throw new Error("Invalid upstream host");
    if (!isValidPort(upstreamPort)) throw new Error("Invalid upstream port");

    const config = this.template(serverName, upstreamHost, upstreamPort);
    const path = normalizeRemotePath(`${SITES_AVAILABLE}/${name}`);
    // Escalated tee (content over stdin) instead of an SFTP write to /etc/nginx.
    const w = await runPrivilegedInput(server, `tee '${path}' >/dev/null`, config);
    if (w.code !== 0) {
      return { ok: false, output: (w.stderr || w.stdout).trim() };
    }
    return this.run(
      server,
      `ln -sf ${SITES_AVAILABLE}/${name} ${SITES_ENABLED}/${name} && nginx -t && systemctl reload nginx`,
    );
  }

  remove(server: SshServer, name: string) {
    if (!isValidName(name)) throw new Error("Invalid site name");
    return this.run(
      server,
      `rm -f ${SITES_ENABLED}/${name} ${SITES_AVAILABLE}/${name} && nginx -t && systemctl reload nginx`,
    );
  }

  private template(serverName: string, host: string, port: number): string {
    return `${MARKER}
server {
  listen 80;
  server_name ${serverName};
  location / {
    proxy_pass http://${host}:${port};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }
}
`;
  }

  private async parse(
    server: SshServer,
    name: string,
    enabled: boolean,
  ): Promise<ProxyEntry> {
    const path = normalizeRemotePath(`${SITES_AVAILABLE}/${name}`);
    let content = "";
    try {
      content = (await runPrivileged(server, `cat '${path}'`)).stdout;
    } catch {
      /* unreadable — surface name only */
    }
    const serverName = content.match(/server_name\s+([^;]+);/)?.[1]?.trim() ?? "";
    const upstream = content.match(/proxy_pass\s+([^;]+);/)?.[1]?.trim() ?? "";
    return { name, serverName, upstream, enabled };
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

export const proxyService = new ProxyService();
