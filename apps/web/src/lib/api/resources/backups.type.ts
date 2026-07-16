export type BackupJob = {
  id: string;
  kind: string;
  source: string;
  target: string;
  intervalMins: number;
  enabled: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
};
