import { describe, expect, it } from "bun:test";

import { CATALOG_APPS, findSpec, INSTALL_SPECS } from "./catalog.constant";

describe("findSpec", () => {
  it("looks up a known app id", () => {
    expect(findSpec("nginx")).toEqual(INSTALL_SPECS.nginx);
    expect(findSpec("docker")?.check).toBe("command -v docker");
  });

  it("returns undefined for an unknown id", () => {
    expect(findSpec("definitely-not-an-app")).toBeUndefined();
    expect(findSpec("")).toBeUndefined();
    expect(findSpec("Nginx")).toBeUndefined();
    expect(findSpec("nginx ")).toBeUndefined();
    expect(findSpec("nginx; id")).toBeUndefined();
    expect(findSpec("../nginx")).toBeUndefined();
  });

  // Regression: a bare index lookup resolved inherited Object.prototype keys,
  // so `findSpec("__proto__")` was truthy and passed the caller's `if (!spec)`
  // allowlist check — driving runCommand with an undefined install command.
  it("does not resolve prototype keys", () => {
    expect(findSpec("__proto__")).toBeUndefined();
    expect(findSpec("toString")).toBeUndefined();
    expect(findSpec("constructor")).toBeUndefined();
    expect(findSpec("hasOwnProperty")).toBeUndefined();
  });
});

describe("INSTALL_SPECS", () => {
  it("has a spec for every catalog app, and no orphan specs", () => {
    const ids = CATALOG_APPS.map((a) => a.id).sort();
    expect(Object.keys(INSTALL_SPECS).sort()).toEqual(ids);
  });

  // The whole security model: install/check scripts are author-defined
  // literals. If a `${` ever shows up here, a client string may be reaching
  // the remote shell.
  it("stores fixed, non-empty command strings with no interpolation", () => {
    for (const spec of Object.values(INSTALL_SPECS)) {
      expect(typeof spec.install).toBe("string");
      expect(typeof spec.check).toBe("string");
      expect(spec.install.length).toBeGreaterThan(0);
      expect(spec.check.length).toBeGreaterThan(0);
      expect(spec.install).not.toContain("${");
      expect(spec.check).not.toContain("${");
    }
  });

  it("builds the cross-manager install for a package-based app", () => {
    expect(INSTALL_SPECS.nginx.install).toContain("apt-get install -y nginx");
    expect(INSTALL_SPECS.nginx.install).toContain("dnf install -y nginx");
    expect(INSTALL_SPECS.nginx.install).toContain("apk add nginx");
    expect(INSTALL_SPECS.postgresql.install).toContain("dnf install -y postgresql-server");
  });
});

describe("CATALOG_APPS", () => {
  it("has unique ids safe to use as a lookup key", () => {
    const ids = CATALOG_APPS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/);
  });
});
