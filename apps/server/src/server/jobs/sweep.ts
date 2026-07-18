// Shared helpers for the per-host sweeps (metric sampler, alert poller). Pure
// and dependency-free so they test without a host, a DB, or a clock.

/** Max concurrent SSH round-trips in one sweep. Bounds load on a weak panel box
 *  while cutting sweep wall-clock from sum-of-hosts to sum-of-hosts / this. */
export const SWEEP_CONCURRENCY = 5;

/** Ticks to skip a host after `fails` consecutive failures: 1,2,4,…,capped.
 *  Keeps a dead host from burning a full SSH timeout on every sweep. */
export const MAX_BACKOFF_TICKS = 32;
export function backoffTicks(fails: number): number {
  if (fails <= 0) return 0;
  return Math.min(2 ** (fails - 1), MAX_BACKOFF_TICKS);
}

/**
 * Run `fn` over `items` with at most `limit` in flight at once. Resolves when
 * all are done; `fn` is expected to swallow its own errors (a throw rejects the
 * whole sweep, which the caller does not want).
 */
export async function mapLimit<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++];
      await fn(item);
    }
  };
  const n = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: n }, worker));
}

/**
 * Per-host failure backoff. Call `nextTick()` once at the start of each sweep,
 * `shouldSkip(key)` before attempting a host, then `onSuccess`/`onFailure`.
 * A repeatedly-unreachable host is skipped for exponentially more ticks so it
 * stops taxing the hosts that are actually up.
 */
export class HostBackoff {
  private tick = 0;
  private state = new Map<string, { fails: number; skipUntil: number }>();

  nextTick(): void {
    this.tick++;
  }

  shouldSkip(key: string): boolean {
    const s = this.state.get(key);
    return s !== undefined && this.tick < s.skipUntil;
  }

  onSuccess(key: string): void {
    this.state.delete(key);
  }

  onFailure(key: string): void {
    const fails = (this.state.get(key)?.fails ?? 0) + 1;
    this.state.set(key, { fails, skipUntil: this.tick + backoffTicks(fails) });
  }

  /** Test/introspection helper. */
  size(): number {
    return this.state.size;
  }
}
