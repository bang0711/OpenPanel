import { registerJob } from "@/server/scheduler";

import { sampleMetrics } from "./metric-sampler";

// Register all background jobs. Called once from index.ts before startScheduler().
export function registerJobs(): void {
  registerJob({
    name: "metric-sampler",
    intervalMs: 60_000,
    run: sampleMetrics,
  });
}
