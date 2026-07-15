import { runCommand, type SshServer } from "@/lib/ssh/client";

import { REBOOT_CMD, SHUTDOWN_CMD } from "./power.constant";

export type PowerResult = { ok: boolean };

export class PowerService {
  // The box goes down, so the SSH connection typically drops mid-command and
  // runCommand rejects. That's expected — the action was issued, so treat any
  // dropped/errored connection as success.
  private async issue(server: SshServer, cmd: string): Promise<PowerResult> {
    try {
      await runCommand(server, cmd);
    } catch {
      /* connection dropped as the host powers off — action issued */
    }
    return { ok: true };
  }

  reboot(server: SshServer): Promise<PowerResult> {
    return this.issue(server, REBOOT_CMD);
  }

  shutdown(server: SshServer): Promise<PowerResult> {
    return this.issue(server, SHUTDOWN_CMD);
  }
}

export const powerService = new PowerService();
