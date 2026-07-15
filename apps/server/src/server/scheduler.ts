// Minimal in-process job scheduler. Each job runs on a fixed interval with an
// overlap guard (a slow run skips its next tick rather than piling up).
// ponytail: single-process setInterval scheduler; move to a worker/queue if
// you run multiple server instances or jobs get heavy.
type Job = { name: string; intervalMs: number; run: () => Promise<void> };

const jobs: Job[] = [];

export function registerJob(job: Job): void {
  jobs.push(job);
}

export function startScheduler(): void {
  for (const job of jobs) {
    let running = false;
    setInterval(async () => {
      if (running) return;
      running = true;
      try {
        await job.run();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[job:${job.name}]`, err);
      } finally {
        running = false;
      }
    }, job.intervalMs);
  }
}
