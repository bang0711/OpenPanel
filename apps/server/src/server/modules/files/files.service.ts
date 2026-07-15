import { posix } from "node:path";

import type { SshServer } from "@/lib/ssh/client";
import {
  sftpChmod,
  sftpList,
  sftpMkdir,
  sftpReadFile,
  sftpRemove,
  sftpRename,
  sftpStat,
  sftpWriteFile,
} from "@/lib/ssh/sftp";

import {
  MAX_DOWNLOAD_BYTES,
  MAX_EDIT_BYTES,
  MODE_RE,
  normalizeRemotePath,
  safeFilename,
} from "./files.constant";

export type FileNode = {
  name: string;
  type: "dir" | "file" | "link" | "other";
  size: number;
  mode: string; // octal, e.g. "644"
  mtime: number; // unix seconds
};

const S_IFMT = 0o170000;

export class FilesService {
  private fileType(mode: number): FileNode["type"] {
    switch (mode & S_IFMT) {
      case 0o040000:
        return "dir";
      case 0o100000:
        return "file";
      case 0o120000:
        return "link";
      default:
        return "other";
    }
  }

  async list(server: SshServer, rawPath: string) {
    const path = normalizeRemotePath(rawPath);
    const list = await sftpList(server, path);
    const entries: FileNode[] = list
      .map((e) => {
        const mode = e.attrs.mode ?? 0;
        return {
          name: e.filename,
          type: this.fileType(mode),
          size: e.attrs.size ?? 0,
          mode: (mode & 0o777).toString(8).padStart(3, "0"),
          mtime: e.attrs.mtime ?? 0,
        };
      })
      .filter((e) => e.name !== "." && e.name !== "..")
      .sort((a, b) => {
        if (a.type === "dir" && b.type !== "dir") return -1;
        if (a.type !== "dir" && b.type === "dir") return 1;
        return a.name.localeCompare(b.name);
      });
    return { path, entries };
  }

  async readText(server: SshServer, rawPath: string) {
    const path = normalizeRemotePath(rawPath);
    const stats = await sftpStat(server, path);
    if ((stats.size ?? 0) > MAX_EDIT_BYTES) {
      throw new Error("File too large to edit (max 1 MB)");
    }
    const buf = await sftpReadFile(server, path);
    return { path, content: buf.toString("utf8") };
  }

  async writeText(server: SshServer, rawPath: string, content: string) {
    const path = normalizeRemotePath(rawPath);
    await sftpWriteFile(server, path, content);
    return { ok: true, path };
  }

  async makeDir(server: SshServer, rawPath: string) {
    const path = normalizeRemotePath(rawPath);
    await sftpMkdir(server, path);
    return { ok: true, path };
  }

  async remove(server: SshServer, rawPath: string) {
    const path = normalizeRemotePath(rawPath);
    await sftpRemove(server, path);
    return { ok: true, path };
  }

  async chmod(server: SshServer, rawPath: string, mode: string) {
    if (!MODE_RE.test(mode)) throw new Error("Invalid mode");
    const path = normalizeRemotePath(rawPath);
    await sftpChmod(server, path, parseInt(mode, 8));
    return { ok: true, path, mode };
  }

  async rename(server: SshServer, rawFrom: string, rawTo: string) {
    const from = normalizeRemotePath(rawFrom);
    const to = normalizeRemotePath(rawTo);
    await sftpRename(server, from, to);
    return { ok: true, from, to };
  }

  async download(server: SshServer, rawPath: string) {
    const path = normalizeRemotePath(rawPath);
    const stats = await sftpStat(server, path);
    if ((stats.size ?? 0) > MAX_DOWNLOAD_BYTES) {
      throw new Error("File too large to download (max 100 MB)");
    }
    const buffer = await sftpReadFile(server, path);
    return { buffer, filename: posix.basename(path) };
  }

  async upload(
    server: SshServer,
    rawDir: string,
    filename: string,
    data: Buffer,
  ) {
    const dir = normalizeRemotePath(rawDir);
    const name = safeFilename(filename);
    const target = normalizeRemotePath(posix.join(dir, name));
    await sftpWriteFile(server, target, data);
    return { ok: true, path: target };
  }
}

export const filesService = new FilesService();
