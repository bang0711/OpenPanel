import { runPrivileged, type SshServer } from "@/lib/ssh/client";

import { type OpenPort, parsePortRow } from "./ports.constant";

export class PortsService {
  async list(server: SshServer): Promise<OpenPort[]> {
    // Escalated so ss/netstat populate the process/PID columns (root-only).
    const { stdout } = await runPrivileged(
      server,
      "ss -tulpnH 2>/dev/null || netstat -tulpn 2>/dev/null",
    );
    const rows: OpenPort[] = [];
    for (const line of stdout.split("\n")) {
      const row = parsePortRow(line);
      if (row) rows.push(row);
    }
    return rows;
  }
}

export const portsService = new PortsService();
