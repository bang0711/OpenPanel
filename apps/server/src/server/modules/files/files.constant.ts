import { posix } from "node:path";

export const MAX_EDIT_BYTES = 1024 * 1024; // 1 MB inline text edit
export const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024; // 100 MB
export const MODE_RE = /^[0-7]{3,4}$/;

/** Reject non-absolute paths and any traversal. Returns the normalized path. */
export function normalizeRemotePath(input: string): string {
  if (typeof input !== "string" || !input.startsWith("/")) {
    throw new Error("Path must be absolute");
  }
  const norm = posix.normalize(input);
  if (norm.split("/").includes("..")) {
    throw new Error("Path traversal rejected");
  }
  return norm;
}

/** A single filename component with no path separators. */
export function safeFilename(name: string): string {
  const base = posix.basename(name);
  if (!base || base === "." || base === ".." || base.includes("/")) {
    throw new Error("Invalid filename");
  }
  return base;
}
