// Retention policy for metric samples. Pure and dependency-free on purpose:
// importing the sampler pulls in Prisma, which throws at import time without
// DATABASE_URL — so the schedule logic lives here where it can be tested.

export const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // keep 7 days of samples
export const PRUNE_EVERY_MS = 60 * 60 * 1000; // hourly

/**
 * Retention only needs to be approximate. The sampler ticks every 60s, and
 * pruning on every tick meant a DELETE against a ~500k-row table every minute
 * to remove, almost always, nothing.
 */
export function isPruneDue(now: number, lastRun: number): boolean {
  return now - lastRun >= PRUNE_EVERY_MS;
}

/** Cutoff timestamp: samples older than this are dropped. */
export function retentionCutoff(now: number): Date {
  return new Date(now - RETENTION_MS);
}
