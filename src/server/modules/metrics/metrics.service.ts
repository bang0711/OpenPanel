import { runCommand, type SshServer } from "@/lib/ssh/client";

export type DiskUsage = {
  filesystem: string;
  sizeBytes: number;
  usedBytes: number;
  availBytes: number;
  usePct: number;
  mount: string;
};

export type ServerMetrics = {
  hostname: string;
  kernel: string;
  cpuCount: number;
  load: [number, number, number];
  uptimeSeconds: number;
  memory: { totalBytes: number; usedBytes: number; availableBytes: number };
  disks: DiskUsage[];
  systemStatus: string;
};

const SEP = "@@OPSEC@@";

// One read-only batch, all fixed commands — no user input interpolated.
const BATCH = [
  "hostname",
  "uname -r",
  "nproc",
  "cat /proc/loadavg",
  "cat /proc/uptime",
  "free -b",
  "df -B1 --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs -x overlay -x squashfs 2>/dev/null",
  "systemctl is-system-running 2>/dev/null || true",
].join(` && echo '${SEP}' && `);

export class MetricsService {
  async collect(server: SshServer): Promise<ServerMetrics> {
    const { stdout } = await runCommand(server, BATCH);
    const parts = stdout.split(SEP).map((p) => p.trim());
    const [
      hostname = "",
      kernel = "",
      nproc = "1",
      loadavg = "",
      uptime = "",
      free = "",
      df = "",
      status = "",
    ] = parts;

    const loadParts = loadavg.split(/\s+/).map(Number);
    const load: [number, number, number] = [
      loadParts[0] || 0,
      loadParts[1] || 0,
      loadParts[2] || 0,
    ];

    return {
      hostname,
      kernel,
      cpuCount: parseInt(nproc, 10) || 1,
      load,
      uptimeSeconds: Math.floor(parseFloat(uptime.split(/\s+/)[0]) || 0),
      memory: this.parseMemory(free),
      disks: this.parseDisks(df),
      systemStatus: status || "unknown",
    };
  }

  private parseMemory(free: string) {
    const line = free.split("\n").find((l) => l.startsWith("Mem:"));
    const cols = line?.trim().split(/\s+/) ?? [];
    // Mem: total used free shared buff/cache available
    const totalBytes = Number(cols[1]) || 0;
    const usedBytes = Number(cols[2]) || 0;
    const availableBytes = Number(cols[6]) || totalBytes - usedBytes;
    return { totalBytes, usedBytes, availableBytes };
  }

  private parseDisks(df: string): DiskUsage[] {
    return df
      .split("\n")
      .slice(1) // drop header
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const c = l.split(/\s+/);
        // source size used avail pcent target
        return {
          filesystem: c[0],
          sizeBytes: Number(c[1]) || 0,
          usedBytes: Number(c[2]) || 0,
          availBytes: Number(c[3]) || 0,
          usePct: parseInt(c[4], 10) || 0,
          mount: c[5] ?? "",
        };
      })
      .filter((d) => d.sizeBytes > 0);
  }
}

export const metricsService = new MetricsService();
