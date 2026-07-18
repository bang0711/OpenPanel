import { runCommand, runPrivileged } from "@/lib/ssh/client";
import { type AuthUser, authorize } from "@/server/access";

import { BULK_ACTIONS, isValidUnit } from "./bulk.constant";
import type { RunBody } from "./bulk.schema";

export type BulkResult = {
  serverId: string;
  name?: string;
  ok: boolean;
  output: string;
};

export class BulkService {
  /**
   * Run one allowlisted action across many servers. Each server is gated
   * individually via `authorize` (per-server permissions), so a caller only
   * touches hosts they may act on. Runs sequentially to bound load.
   */
  async run(
    user: AuthUser,
    serverIds: string[],
    action: RunBody["action"],
    unit?: string,
  ): Promise<BulkResult[]> {
    const level = BULK_ACTIONS[action].level;

    // Build the command once — identical for every server. service-restart is
    // the only action that interpolates client input, and only after regex
    // validation of the unit name.
    let cmd: string;
    if (action === "service-restart") {
      if (!unit || !isValidUnit(unit)) throw new Error("Invalid or missing unit");
      cmd = `systemctl restart ${unit}`;
    } else {
      cmd = BULK_ACTIONS[action].cmd;
    }
    // Read actions (uptime/disk) run unprivileged; write/admin ones escalate.
    const exec = level === "read" ? runCommand : runPrivileged;

    const results: BulkResult[] = [];
    for (const serverId of serverIds) {
      const gate = await authorize(serverId, user, level);
      if (!gate.ok) {
        results.push({ serverId, ok: false, output: gate.error });
        continue;
      }
      try {
        const { stdout, stderr, code } = await exec(gate.server, cmd);
        results.push({
          serverId,
          name: gate.server.name,
          ok: code === 0,
          output: (stderr || stdout).slice(0, 4000),
        });
      } catch (err) {
        results.push({
          serverId,
          name: gate.server.name,
          ok: false,
          output: err instanceof Error ? err.message : "SSH connection failed",
        });
      }
    }
    return results;
  }
}

export const bulkService = new BulkService();
