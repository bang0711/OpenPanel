import { describe, expect, it } from "bun:test";

import { isDocsPath } from "./proxy";

// The API docs must not be reachable through the public web origin. Guard the
// path matcher so a rename can't silently re-expose /api/docs.
describe("isDocsPath", () => {
  it("blocks the docs UI and its spec", () => {
    expect(isDocsPath("/api/docs")).toBe(true);
    expect(isDocsPath("/api/docs/")).toBe(true);
    expect(isDocsPath("/api/docs/json")).toBe(true);
    expect(isDocsPath("/api/docs/openapi.json")).toBe(true);
  });

  it("does not block real API routes", () => {
    expect(isDocsPath("/api/servers")).toBe(false);
    expect(isDocsPath("/api/health")).toBe(false);
    expect(isDocsPath("/api/auth/session")).toBe(false);
    // A route that merely starts with the same letters must not be caught.
    expect(isDocsPath("/api/docsomething")).toBe(false);
  });
});
