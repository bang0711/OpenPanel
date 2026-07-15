import { registerJob } from "@/server/scheduler";

import { pollAlerts } from "./alert-poller";
import { runBackups } from "./backup-runner";
import { sampleMetrics } from "./metric-sampler";

// Register all background jobs. Called once from index.ts before startScheduler().
export function registerJobs(): void {
  registerJob({
    name: "metric-sampler",
    intervalMs: 60_000,
    run: sampleMetrics,
  });
  registerJob({
    name: "alert-poller",
    intervalMs: 60_000,
    run: pollAlerts,
  });
  registerJob({
    name: "backup-runner",
    intervalMs: 60_000,
    run: runBackups,
  });
}
