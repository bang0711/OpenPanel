import { runCommand, runPrivileged, type SshServer } from "@/lib/ssh/client";

import { isValidUsername, SHELLS } from "./users.constant";

export type SysUser = {
  name: string;
  uid: number;
  gid: number;
  home: string;
  shell: string;
};

export class UsersService {
  async list(server: SshServer): Promise<SysUser[]> {
    const { stdout } = await runCommand(server, "getent passwd");
    return this.parse(stdout);
  }

  async create(server: SshServer, username: string, shell?: string) {
    if (!isValidUsername(username)) throw new Error("Invalid username");
    let cmd = `useradd -m ${username}`;
    if (shell) {
      if (!SHELLS.includes(shell as (typeof SHELLS)[number]))
        throw new Error("Invalid shell");
      cmd += ` -s ${shell}`;
    }
    return this.run(server, cmd);
  }

  async remove(server: SshServer, username: string) {
    if (!isValidUsername(username)) throw new Error("Invalid username");
    return this.run(server, `userdel -r ${username}`);
  }

  async setSudo(server: SshServer, username: string, enable: boolean) {
    if (!isValidUsername(username)) throw new Error("Invalid username");
    // Group names are static (never user input). Debian uses `sudo`, RHEL `wheel`.
    const cmd = enable
      ? `usermod -aG sudo ${username} 2>/dev/null || usermod -aG wheel ${username}`
      : `gpasswd -d ${username} sudo 2>/dev/null || gpasswd -d ${username} wheel`;
    return this.run(server, cmd);
  }

  private async run(server: SshServer, cmd: string) {
    const { stdout, stderr, code } = await runPrivileged(server, cmd);
    if (code !== 0) throw new Error((stderr || stdout).trim() || "Command failed");
    return { ok: true, output: (stderr || stdout).trim() };
  }

  private parse(out: string): SysUser[] {
    const users: SysUser[] = [];
    for (const raw of out.split("\n")) {
      const line = raw.trim();
      if (!line) continue;
      const parts = line.split(":");
      if (parts.length < 7) continue;
      const uid = parseInt(parts[2], 10);
      const gid = parseInt(parts[3], 10);
      if (Number.isNaN(uid)) continue;
      // Human accounts only: root (uid 0) or regular users (uid >= 1000).
      if (uid !== 0 && uid < 1000) continue;
      users.push({
        name: parts[0],
        uid,
        gid,
        home: parts[5],
        shell: parts[6],
      });
    }
    return users;
  }
}

export const usersService = new UsersService();
