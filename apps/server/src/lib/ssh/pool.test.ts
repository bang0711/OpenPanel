import { describe, expect, it } from "bun:test";

import { ConnectionPool } from "./pool";

type FakeClient = { id: number; ended: boolean; end(): void };

/** Fake transport: connects only when the test says so. */
function harness(idleMs = 60_000) {
  let next = 0;
  const opened: FakeClient[] = [];
  const gone: Array<() => void> = [];
  let settle: Array<{ resolve: () => void; reject: (e: Error) => void }> = [];

  const pool = new ConnectionPool<FakeClient>((_key, onGone) => {
    const client: FakeClient = {
      id: next++,
      ended: false,
      end() {
        this.ended = true;
      },
    };
    opened.push(client);
    gone.push(onGone);
    const ready = new Promise<FakeClient>((resolve, reject) => {
      settle.push({ resolve: () => resolve(client), reject });
    });
    return { client, ready };
  }, idleMs);

  return {
    pool,
    opened,
    /** Simulate the transport becoming usable. */
    connectAll: () => {
      settle.forEach((s) => s.resolve());
      settle = [];
    },
    failNext: (err: Error) => {
      settle.forEach((s) => s.reject(err));
      settle = [];
    },
    /** Simulate a close/error event for the nth opened client. */
    fire: (n: number) => gone[n](),
  };
}

describe("ConnectionPool", () => {
  it("reuses one connection for sequential acquires", async () => {
    const h = harness();
    const p = h.pool.acquire("host");
    h.connectAll();
    const a = await p;
    h.pool.release("host", a);

    const b = await h.pool.acquire("host");
    expect(h.opened.length).toBe(1);
    expect(b.client.id).toBe(a.client.id);
  });

  // Regression: `pool.set` used to run only on "ready", so two concurrent
  // acquires each dialed and the second overwrote the first — orphaning a live
  // connection that release() could never reach (it stayed up on keepalive).
  it("dedupes concurrent acquires onto one connection", async () => {
    const h = harness();
    const first = h.pool.acquire("host");
    const second = h.pool.acquire("host");
    h.connectAll();

    const [a, b] = await Promise.all([first, second]);
    expect(h.opened.length).toBe(1);
    expect(a).toBe(b);
    expect(a.refs).toBe(2);
    expect(h.pool.size).toBe(1);
  });

  // Regression: close/error handlers used to `pool.delete(key)` unconditionally,
  // so a dying orphan evicted whichever entry currently held the key.
  it("a stale entry's close does not evict the live entry", async () => {
    const h = harness();
    const p1 = h.pool.acquire("host");
    h.connectAll();
    const first = await p1;

    // First connection dies and is evicted.
    h.fire(0);
    expect(h.pool.has("host")).toBe(false);

    // A replacement takes the key.
    const p2 = h.pool.acquire("host");
    h.connectAll();
    const second = await p2;
    expect(second).not.toBe(first);
    expect(h.pool.has("host")).toBe(true);

    // The dead first connection fires close again (ssh2 emits error then close).
    h.fire(0);

    expect(h.pool.has("host")).toBe(true); // live entry survives
  });

  it("drops a failed dial so the next acquire retries", async () => {
    const h = harness();
    const p = h.pool.acquire("host");
    h.failNext(new Error("ECONNREFUSED"));
    await expect(p).rejects.toThrow("ECONNREFUSED");
    expect(h.pool.has("host")).toBe(false);

    const p2 = h.pool.acquire("host");
    h.connectAll();
    await p2;
    expect(h.opened.length).toBe(2); // dialed again rather than reusing a dead entry
  });

  it("keeps the connection while borrowers remain, closes it once idle", async () => {
    const h = harness(5);
    const p1 = h.pool.acquire("host");
    const p2 = h.pool.acquire("host");
    h.connectAll();
    const a = await p1;
    await p2;

    h.pool.release("host", a);
    await Bun.sleep(15);
    expect(a.client.ended).toBe(false); // one borrower left
    expect(h.pool.has("host")).toBe(true);

    h.pool.release("host", a);
    await Bun.sleep(15);
    expect(a.client.ended).toBe(true);
    expect(h.pool.has("host")).toBe(false);
  });

  it("cancels the idle close when reacquired in time", async () => {
    const h = harness(30);
    const p = h.pool.acquire("host");
    h.connectAll();
    const a = await h.pool.acquire("host").then(() => p);
    h.pool.release("host", a);
    h.pool.release("host", a); // refs 0 -> idle timer armed

    const again = await h.pool.acquire("host"); // before idleMs elapses
    await Bun.sleep(50);

    expect(again.client.ended).toBe(false);
    expect(h.pool.has("host")).toBe(true);
    expect(h.opened.length).toBe(1);
  });

  it("pools per key", async () => {
    const h = harness();
    const a = h.pool.acquire("a");
    const b = h.pool.acquire("b");
    h.connectAll();
    await Promise.all([a, b]);
    expect(h.opened.length).toBe(2);
    expect(h.pool.size).toBe(2);
  });
});
