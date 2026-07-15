import { runCommand, runCommandInput, type SshServer } from "@/lib/ssh/client";

import { isValidCommand, isValidSchedule } from "./cron.constant";

export type CronJob = {
  index: number;
  schedule: string;
  command: string;
  raw: string;
};

export class CronService {
  async list(server: SshServer): Promise<CronJob[]> {
    const { stdout } = await runCommand(server, "crontab -l 2>/dev/null");
    return this.parse(stdout);
  }

  async add(server: SshServer, schedule: string, command: string) {
    if (!isValidSchedule(schedule)) throw new Error("Invalid schedule");
    if (!isValidCommand(command)) throw new Error("Invalid command");
    const current = (await runCommand(server, "crontab -l 2>/dev/null")).stdout;
    const line = `${schedule.trim()} ${command.trim()}`;
    const body = current.replace(/\n*$/, "\n") + line + "\n";
    return this.write(server, body);
  }

  async remove(server: SshServer, index: number) {
    const current = (await runCommand(server, "crontab -l 2>/dev/null")).stdout;
    let jobIdx = 0;
    const kept: string[] = [];
    for (const raw of current.split("\n")) {
      const line = raw.trim();
      const isJob = line.length > 0 && !line.startsWith("#");
      if (isJob) {
        if (jobIdx === index) {
          jobIdx++;
          continue; // drop this job line
        }
        jobIdx++;
      }
      kept.push(raw);
    }
    const body = kept.join("\n").replace(/\n*$/, "\n");
    return this.write(server, body);
  }

  private async write(server: SshServer, body: string) {
    const { stderr, code } = await runCommandInput(server, "crontab -", body);
    if (code !== 0) throw new Error(stderr.trim() || "Failed to write crontab");
    return { ok: true };
  }

  private parse(out: string): CronJob[] {
    const jobs: CronJob[] = [];
    let index = 0;
    for (const raw of out.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      let schedule: string;
      let command: string;
      if (line.startsWith("@")) {
        const sp = line.indexOf(" ");
        schedule = sp === -1 ? line : line.slice(0, sp);
        command = sp === -1 ? "" : line.slice(sp + 1).trim();
      } else {
        const parts = line.split(/\s+/);
        schedule = parts.slice(0, 5).join(" ");
        command = parts.slice(5).join(" ");
      }
      jobs.push({ index: index++, schedule, command, raw: line });
    }
    return jobs;
  }
}

export const cronService = new CronService();
