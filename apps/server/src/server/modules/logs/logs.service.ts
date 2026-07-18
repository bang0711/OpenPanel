import { runPrivileged, type SshServer } from "@/lib/ssh/client";

import { LOG_SOURCES, unitCmd, UNIT_RE } from "./logs.constant";

export type LogSource = { key: string; label: string };
export type LogTail = { content: string };

export class LogsService {
  // Static allowlist (keys + labels) for the UI. Still gated by loadOwnedServer.
  sources(): LogSource[] {
    return [
      ...LOG_SOURCES.map((s) => ({ key: s.key, label: s.label })),
      { key: "unit", label: "unit" },
    ];
  }

  async tail(
    server: SshServer,
    source: string,
    lines: number,
    unit?: string,
  ): Promise<LogTail> {
    const n = clampLines(lines);

    let cmd: string;
    if (source === "unit") {
      if (!unit || unit.length > 128 || !UNIT_RE.test(unit)) {
        throw new Error("Invalid systemd unit");
      }
      cmd = unitCmd(unit, n);
    } else {
      const src = LOG_SOURCES.find((s) => s.key === source);
      if (!src) throw new Error("Unknown log source");
      cmd = src.cmd(n);
    }

    // Escalated: /var/log/auth.log, the journal, etc. are commonly root-only.
    const { stdout, stderr } = await runPrivileged(server, cmd);
    return { content: stdout || stderr };
  }
}

// Clamp to a sane integer range; default to 200 for missing/invalid input.
function clampLines(lines: number): number {
  if (!Number.isFinite(lines)) return 200;
  return Math.min(2000, Math.max(1, Math.trunc(lines)));
}

export const logsService = new LogsService();
