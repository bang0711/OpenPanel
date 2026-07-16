import { describe, expect, it } from "bun:test";

import { joinPath, parentOf } from "./remote-path";

describe("parentOf", () => {
  it("walks up one level", () => {
    expect(parentOf("/var/log/nginx")).toBe("/var/log");
    expect(parentOf("/var/log")).toBe("/var");
  });

  // The file manager calls this on every "up" click — root must be a fixed
  // point or the breadcrumb walks off the top.
  it("stops at root", () => {
    expect(parentOf("/")).toBe("/");
    expect(parentOf("/var")).toBe("/");
  });

  it("tolerates trailing and doubled slashes", () => {
    expect(parentOf("/var/log/")).toBe("/var");
    expect(parentOf("/var//log")).toBe("/var");
  });
});

describe("joinPath", () => {
  it("joins under a directory", () => {
    expect(joinPath("/var/log", "syslog")).toBe("/var/log/syslog");
  });

  // Without the special case this yields "//etc" — a valid but ugly path that
  // then round-trips badly through parentOf.
  it("does not double the slash at root", () => {
    expect(joinPath("/", "etc")).toBe("/etc");
  });

  it("round-trips with parentOf", () => {
    const dir = "/var/log";
    expect(parentOf(joinPath(dir, "syslog"))).toBe(dir);
    expect(parentOf(joinPath("/", "etc"))).toBe("/");
  });
});
