import { describe, expect, it } from "bun:test";
import { PassThrough } from "node:stream";

import { collectStream, type Collected } from "./collect";

function collect(cap: number) {
  const stream = new PassThrough();
  let result: Collected | undefined;
  collectStream(stream, cap, (r) => (result = r));
  return { stream, get result() {
    return result;
  } };
}

describe("collectStream", () => {
  it("collects output under the cap", async () => {
    const c = collect(100);
    c.stream.write("hello ");
    c.stream.write("world");
    c.stream.end();
    await Bun.sleep(1);

    expect(c.result).toEqual({ text: "hello world", truncated: false });
  });

  it("reports empty output", async () => {
    const c = collect(100);
    c.stream.end();
    await Bun.sleep(1);
    expect(c.result).toEqual({ text: "", truncated: false });
  });

  // The whole point: a single huge command must not buffer unbounded into RAM.
  it("stops at the cap and flags truncation", async () => {
    const c = collect(10);
    c.stream.write("0123456789ABCDEFGH");
    await Bun.sleep(1);

    expect(c.result?.text).toBe("0123456789");
    expect(c.result?.text.length).toBe(10);
    expect(c.result?.truncated).toBe(true);
  });

  it("destroys the stream once capped, so the remote stops sending", async () => {
    const c = collect(4);
    c.stream.write("aaaaaaaaaa");
    await Bun.sleep(1);

    expect(c.stream.destroyed).toBe(true);
    expect(c.result?.truncated).toBe(true);
  });

  it("caps across many small chunks, not just one big one", async () => {
    const c = collect(5);
    for (let i = 0; i < 20; i++) c.stream.write("x");
    await Bun.sleep(1);

    expect(c.result?.text).toBe("xxxxx");
    expect(c.result?.truncated).toBe(true);
  });

  it("keeps the boundary chunk exactly at the cap", async () => {
    const c = collect(6);
    c.stream.write("abc");
    c.stream.write("defgh");
    await Bun.sleep(1);

    expect(c.result?.text).toBe("abcdef");
    expect(c.result?.truncated).toBe(true);
  });

  // Output that exactly fills the cap lost nothing — flagging it truncated
  // would tell the user their result set was cut when it wasn't.
  it("does not flag output that exactly fills the cap", async () => {
    const c = collect(5);
    c.stream.write("abcde");
    c.stream.end();
    await Bun.sleep(1);

    expect(c.result).toEqual({ text: "abcde", truncated: false });
  });

  it("flags the very next byte past a full cap", async () => {
    const c = collect(5);
    c.stream.write("abcde");
    c.stream.write("f");
    await Bun.sleep(1);

    expect(c.result).toEqual({ text: "abcde", truncated: true });
  });

  it("calls back exactly once", async () => {
    const stream = new PassThrough();
    let calls = 0;
    collectStream(stream, 100, () => calls++);
    stream.write("hi");
    stream.end();
    stream.destroy();
    await Bun.sleep(2);

    expect(calls).toBe(1);
  });
});
