// Reference-counted connection pool with idle eviction.
//
// Transport-agnostic on purpose: the bookkeeping here (dedupe, refs, identity
// checks, idle timers) is where the bugs live, and keeping it free of ssh2 lets
// it be tested with a fake connect — no host, no network.

export type Closable = { end(): void };

export type PoolEntry<C extends Closable> = {
  client: C;
  /** Resolves when the connection is usable. Shared by concurrent acquirers. */
  ready: Promise<C>;
  refs: number;
  idle?: ReturnType<typeof setTimeout>;
};

/**
 * `connect` must wire the transport's close/error events to `onGone` so the
 * pool can drop a dead entry. It is called at most once per pooled entry.
 */
export type Connect<C extends Closable> = (
  key: string,
  onGone: () => void,
) => { client: C; ready: Promise<C> };

export class ConnectionPool<C extends Closable> {
  private readonly entries = new Map<string, PoolEntry<C>>();

  constructor(
    private readonly connect: Connect<C>,
    private readonly idleMs: number,
  ) {}

  /**
   * Borrow a connection, opening one if needed. Concurrent callers for the same
   * key share a single connection: the entry is registered *before* the
   * transport finishes connecting, so the second caller awaits the same
   * `ready` promise instead of dialing a second time and orphaning the first.
   */
  async acquire(key: string): Promise<PoolEntry<C>> {
    const existing = this.entries.get(key);
    if (existing) {
      existing.refs++;
      this.clearIdle(existing);
      await existing.ready; // may still be connecting, or may reject
      return existing;
    }

    const entry: PoolEntry<C> = {
      refs: 1,
      // Assigned synchronously by `connect` below, before any await.
      client: undefined as unknown as C,
      ready: undefined as unknown as Promise<C>,
    };
    // Registered before connecting: a concurrent acquire must find this entry.
    this.entries.set(key, entry);

    const { client, ready } = this.connect(key, () => this.evict(key, entry));
    entry.client = client;
    entry.ready = ready;

    try {
      await ready;
    } catch (err) {
      // A failed dial must not linger, or every later acquire inherits it.
      this.evict(key, entry);
      throw err;
    }
    return entry;
  }

  /** Return a borrowed connection. Closes it once idle for `idleMs`. */
  release(key: string, entry: PoolEntry<C>): void {
    entry.refs = Math.max(0, entry.refs - 1);
    if (entry.refs > 0) return;

    this.clearIdle(entry);
    entry.idle = setTimeout(() => {
      this.evict(key, entry);
      try {
        entry.client.end();
      } catch {
        /* already gone */
      }
    }, this.idleMs);
    // Don't keep the process alive just to close an idle socket.
    entry.idle.unref?.();
  }

  /**
   * Drop `entry` if it is still the live one for `key`. The identity check
   * matters: a dying orphan must not evict the connection that replaced it.
   */
  private evict(key: string, entry: PoolEntry<C>): void {
    this.clearIdle(entry);
    if (this.entries.get(key) === entry) this.entries.delete(key);
  }

  private clearIdle(entry: PoolEntry<C>): void {
    if (entry.idle) {
      clearTimeout(entry.idle);
      entry.idle = undefined;
    }
  }

  /** Live entries. Test/introspection only. */
  get size(): number {
    return this.entries.size;
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }
}
