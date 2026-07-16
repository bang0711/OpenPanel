export type DiskUsage = {
  filesystem: string;
  sizeBytes: number;
  usedBytes: number;
  availBytes: number;
  usePct: number;
  mount: string;
};

export type MetricHistoryPoint = {
  cpuLoad: number;
  memUsedPct: number;
  diskUsedPct: number;
  createdAt: string;
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
