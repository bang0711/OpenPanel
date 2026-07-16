import { describe, expect, it } from "bun:test";

import { API_ENDPOINT } from "./endpoint.constant";

describe("API_ENDPOINT", () => {
  it("derives server-scoped paths from one base", () => {
    expect(API_ENDPOINT.SERVERS.ROOT).toBe("/servers");
    expect(API_ENDPOINT.SERVERS.BY_ID("abc")).toBe("/servers/abc");
    expect(API_ENDPOINT.SERVERS.TEST("abc")).toBe("/servers/abc/test");
    expect(API_ENDPOINT.METRICS.ROOT("abc")).toBe("/servers/abc/metrics");
  });

  it("builds paths relative to /api, without repeating it", () => {
    // request() prefixes "/api"; a path that also carried it would 404.
    expect(API_ENDPOINT.SERVERS.ROOT.startsWith("/api")).toBe(false);
    expect(API_ENDPOINT.SERVERS.BY_ID("x").startsWith("/servers")).toBe(true);
  });

  // A unit name lands in the URL path; systemd allows `@` and `\` in unit
  // names, and an unescaped `/` or `?` would silently retarget the request.
  it("escapes unit names in the path", () => {
    expect(API_ENDPOINT.SERVICES.ACTION("s1", "getty@tty1.service")).toBe(
      "/servers/s1/services/getty%40tty1.service/action",
    );
    expect(API_ENDPOINT.SERVICES.LOGS("s1", "a/b")).toBe(
      "/servers/s1/services/a%2Fb/logs",
    );
    expect(API_ENDPOINT.SERVICES.ACTION("s1", "x?y=1")).toContain("x%3Fy%3D1");
  });

  it("escapes file paths in the download query", () => {
    expect(API_ENDPOINT.FILES.DOWNLOAD("s1", "/var/log/my app.log")).toBe(
      "/servers/s1/files/download?path=%2Fvar%2Flog%2Fmy%20app.log",
    );
  });

  // An unescaped `&` would let a filename inject another query parameter.
  it("prevents query injection through a filename", () => {
    const url = API_ENDPOINT.FILES.DOWNLOAD("s1", "/tmp/a&admin=1");
    expect(url).toContain("%26admin%3D1");
    expect(url.split("&").length).toBe(1);
  });
});
