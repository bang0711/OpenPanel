import { describe, expect, it } from "bun:test";

import { normalizeRemotePath, safeFilename } from "./files.constant";

// Security boundary: these guard every SFTP path that reaches a remote host.
describe("normalizeRemotePath", () => {
  it("normalizes absolute paths", () => {
    expect(normalizeRemotePath("/var/log")).toBe("/var/log");
    expect(normalizeRemotePath("/var//log/")).toBe("/var/log/");
    expect(normalizeRemotePath("/var/./log")).toBe("/var/log");
  });

  it("resolves traversal instead of leaking it downstream", () => {
    expect(normalizeRemotePath("/var/log/../lib")).toBe("/var/lib");
  });

  // `posix.normalize` clamps `..` at root for absolute inputs, so these
  // resolve rather than throw. The result is always a normalized absolute
  // path — the guarantee callers depend on before handing it to SFTP.
  // (The "Path traversal rejected" branch is unreachable for absolute input;
  // it only guards a future caller that allows relative paths.)
  it("clamps leading traversal at root", () => {
    expect(normalizeRemotePath("/../etc/shadow")).toBe("/etc/shadow");
    expect(normalizeRemotePath("/var/../../etc/shadow")).toBe("/etc/shadow");
  });

  it("rejects relative paths", () => {
    expect(() => normalizeRemotePath("etc/passwd")).toThrow("absolute");
    expect(() => normalizeRemotePath("../etc")).toThrow("absolute");
    expect(() => normalizeRemotePath("")).toThrow("absolute");
  });
});

describe("safeFilename", () => {
  it("accepts a plain filename", () => {
    expect(safeFilename("notes.txt")).toBe("notes.txt");
  });

  // Contract is sanitise-to-basename, not reject: any directory part is
  // stripped, so the result can never escape the target directory.
  it("strips directory components", () => {
    expect(safeFilename("../etc/passwd")).toBe("passwd");
    expect(safeFilename("a/b")).toBe("b");
    expect(safeFilename("/etc/shadow")).toBe("shadow");
  });

  it("rejects names with no usable component", () => {
    expect(() => safeFilename("..")).toThrow("Invalid filename");
    expect(() => safeFilename(".")).toThrow("Invalid filename");
    expect(() => safeFilename("")).toThrow("Invalid filename");
    expect(() => safeFilename("/")).toThrow("Invalid filename");
  });
});
