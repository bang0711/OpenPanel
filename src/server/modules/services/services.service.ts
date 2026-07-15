import { runCommand, type SshServer } from "@/lib/ssh/client";

import {
  isValidUnit,
  KILL_SIGNALS,
  type KillSignal,
  SERVICE_ACTIONS,
  type ServiceAction,
} from "./services.constant";

export type ServiceUnit = {
  unit: string;
  load: string;
  active: string;
  sub: string;
  description: string;
};

export type ProcessInfo = {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
};

export class ServicesService {
  async listServices(server: SshServer): Promise<ServiceUnit[]> {
    const { stdout } = await runCommand(
      server,
      "systemctl list-units --type=service --all --output=json --no-pager 2>/dev/null",
    );
    try {
      const rows = JSON.parse(stdout) as ServiceUnit[];
      return rows.map((r) => ({
        unit: r.unit,
        load: r.load,
        active: r.active,
        sub: r.sub,
        description: r.description,
      }));
    } catch {
      return [];
    }
  }

  async action(
    server: SshServer,
    name: string,
    action: ServiceAction,
  ): Promise<{ ok: boolean; output: string }> {
    if (!isValidUnit(name)) throw new Error("Invalid service name");
    if (!SERVICE_ACTIONS.includes(action)) throw new Error("Invalid action");
    const { stdout, stderr, code } = await runCommand(
      server,
      `systemctl ${action} ${name}`,
    );
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }

  async logs(server: SshServer, name: string, lines = 200): Promise<string> {
    if (!isValidUnit(name)) throw new Error("Invalid service name");
    const n = Math.min(Math.max(Math.trunc(lines), 1), 1000);
    const { stdout } = await runCommand(
      server,
      `journalctl -u ${name} -n ${n} --no-pager 2>&1`,
    );
    return stdout;
  }

  async listProcesses(
    server: SshServer,
    limit = 60,
  ): Promise<ProcessInfo[]> {
    const { stdout } = await runCommand(
      server,
      "ps -eo pid,user,pcpu,pmem,comm --sort=-pcpu --no-headers 2>/dev/null",
    );
    return stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, limit)
      .map((l) => {
        const c = l.split(/\s+/);
        return {
          pid: parseInt(c[0], 10),
          user: c[1] ?? "",
          cpu: parseFloat(c[2]) || 0,
          mem: parseFloat(c[3]) || 0,
          command: c.slice(4).join(" "),
        };
      })
      .filter((p) => Number.isFinite(p.pid));
  }

  async kill(
    server: SshServer,
    pid: number,
    signal: KillSignal,
  ): Promise<{ ok: boolean; output: string }> {
    if (!Number.isInteger(pid) || pid <= 1) throw new Error("Invalid pid");
    if (!KILL_SIGNALS.includes(signal)) throw new Error("Invalid signal");
    const { stdout, stderr, code } = await runCommand(
      server,
      `kill -${signal} ${pid}`,
    );
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }
}

export const servicesService = new ServicesService();
