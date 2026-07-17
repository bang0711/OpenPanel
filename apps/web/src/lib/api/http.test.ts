import { afterEach, describe, expect, it } from "bun:test";

import { ApiError, request } from "./http";

type Call = { url: string; init: RequestInit };

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Stub fetch, capturing what the wrapper actually sent. */
function stub(res: { status?: number; body?: unknown }) {
  const calls: Call[] = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return {
      ok: (res.status ?? 200) < 400,
      status: res.status ?? 200,
      json: async () => res.body ?? null,
    };
  }) as unknown as typeof fetch;
  return calls;
}

describe("request", () => {
  it("calls same-origin /api and sends the session cookie", async () => {
    const calls = stub({ body: { ok: true } });
    await request("GET", "/servers");

    expect(calls[0].url).toBe("/api/servers");
    // The browser only attaches the first-party cookie when asked.
    expect(calls[0].init.credentials).toBe("include");
  });

  it("returns the parsed body", async () => {
    stub({ body: [{ id: "1" }] });
    expect(await request<{ id: string }[]>("GET", "/servers")).toEqual([{ id: "1" }]);
  });

  it("JSON-encodes a body and sets the content type", async () => {
    const calls = stub({ body: {} });
    await request("POST", "/servers", { body: { name: "web-1" } });

    expect(calls[0].init.body).toBe('{"name":"web-1"}');
    expect(calls[0].init.headers).toEqual({ "content-type": "application/json" });
  });

  it("sends FormData untouched, with no content-type", async () => {
    const calls = stub({ body: {} });
    const form = new FormData();
    form.set("file", new Blob(["x"]), "a.txt");
    await request("POST", "/upload", { body: form });

    // Setting content-type by hand would clobber the multipart boundary.
    expect(calls[0].init.headers).toBeUndefined();
    expect(calls[0].init.body).toBe(form);
  });

  it("builds a query string", async () => {
    const calls = stub({ body: {} });
    await request("GET", "/logs", { query: { unit: "nginx.service", lines: 100 } });

    expect(calls[0].url).toBe("/api/logs?unit=nginx.service&lines=100");
  });

  it("drops undefined query values instead of sending 'undefined'", async () => {
    const calls = stub({ body: {} });
    await request("GET", "/logs", { query: { unit: undefined, lines: 10 } });

    expect(calls[0].url).toBe("/api/logs?lines=10");
  });

  it("encodes query values", async () => {
    const calls = stub({ body: {} });
    await request("GET", "/files", { query: { path: "/var/log/my app" } });

    expect(calls[0].url).toBe("/api/files?path=%2Fvar%2Flog%2Fmy+app");
  });

  it("omits the query string entirely when not given", async () => {
    const calls = stub({ body: {} });
    await request("GET", "/servers");
    expect(calls[0].url).not.toContain("?");
  });

  it("throws ApiError carrying the backend's message", async () => {
    stub({ status: 403, body: { error: "Forbidden" } });

    const err = (await request("GET", "/servers").catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(403);
    expect(err.message).toBe("Forbidden");
  });

  // A 502 from a dead SSH host may have no JSON body at all — the user must
  // still get a usable message rather than "undefined".
  it("falls back to a status message when the body has no error field", async () => {
    stub({ status: 500, body: null });
    const err = (await request("GET", "/servers").catch((e) => e)) as ApiError;
    expect(err.message).toBe("Request failed (500)");
  });

  it("falls back when the body is not JSON", async () => {
    globalThis.fetch = (async () => ({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("not json");
      },
    })) as unknown as typeof fetch;

    const err = (await request("GET", "/servers").catch((e) => e)) as ApiError;
    expect(err.status).toBe(502);
    expect(err.message).toBe("Request failed (502)");
  });
});
