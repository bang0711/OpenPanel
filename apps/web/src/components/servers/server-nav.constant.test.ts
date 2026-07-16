import { describe, expect, it } from "bun:test";

import { isNavItemActive, NAV_GROUPS, navHref } from "./server-nav.constant";

const BASE = "/servers/abc";

describe("isNavItemActive", () => {
  it("matches the dashboard only on the exact base", () => {
    expect(isNavItemActive(BASE, BASE, "")).toBe(true);
    expect(isNavItemActive(`${BASE}/services`, BASE, "")).toBe(false);
  });

  it("matches a segment and its children", () => {
    expect(isNavItemActive(`${BASE}/services`, BASE, "services")).toBe(true);
    expect(isNavItemActive(`${BASE}/services/nginx`, BASE, "services")).toBe(
      true,
    );
  });

  // Regression: a bare startsWith lit up `db` while on `db-backup`.
  it("does not match a segment that is only a prefix of the route", () => {
    expect(isNavItemActive(`${BASE}/db-backup`, BASE, "db")).toBe(false);
    expect(isNavItemActive(`${BASE}/db-backup`, BASE, "db-backup")).toBe(true);
  });

  it("does not match another server", () => {
    expect(isNavItemActive("/servers/xyz/services", BASE, "services")).toBe(
      false,
    );
  });
});

describe("navHref", () => {
  it("builds hrefs, with the dashboard at the base", () => {
    expect(navHref(BASE, "")).toBe(BASE);
    expect(navHref(BASE, "services")).toBe(`${BASE}/services`);
  });
});

describe("NAV_GROUPS", () => {
  it("has unique segments", () => {
    const segs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.seg));
    expect(new Set(segs).size).toBe(segs.length);
  });

  it("has exactly one dashboard entry", () => {
    const segs = NAV_GROUPS.flatMap((g) => g.items.map((i) => i.seg));
    expect(segs.filter((s) => s === "").length).toBe(1);
  });
});
