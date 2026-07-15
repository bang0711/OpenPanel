import type { FileEntry, SFTPWrapper,Stats } from "ssh2";

import { type SshServer,withSSH } from "./client";

/** Open an SFTP session, run `fn`, and let withSSH close the connection. */
export function withSFTP<T>(
  server: SshServer,
  fn: (sftp: SFTPWrapper) => Promise<T>,
): Promise<T> {
  return withSSH(
    server,
    (conn) =>
      new Promise<T>((resolve, reject) => {
        conn.sftp((err, sftp) => {
          if (err) return reject(err);
          fn(sftp).then(resolve, reject);
        });
      }),
  );
}

export function sftpList(
  server: SshServer,
  path: string,
): Promise<FileEntry[]> {
  return withSFTP(
    server,
    (sftp) =>
      new Promise((resolve, reject) => {
        sftp.readdir(path, (err, list) => (err ? reject(err) : resolve(list)));
      }),
  );
}

export function sftpStat(server: SshServer, path: string): Promise<Stats> {
  return withSFTP(
    server,
    (sftp) =>
      new Promise((resolve, reject) => {
        sftp.stat(path, (err, stats) => (err ? reject(err) : resolve(stats)));
      }),
  );
}

export function sftpReadFile(
  server: SshServer,
  path: string,
): Promise<Buffer> {
  return withSFTP(
    server,
    (sftp) =>
      new Promise((resolve, reject) => {
        sftp.readFile(path, (err, data) =>
          err ? reject(err) : resolve(data as Buffer),
        );
      }),
  );
}

export function sftpWriteFile(
  server: SshServer,
  path: string,
  data: Buffer | string,
): Promise<void> {
  return withSFTP(
    server,
    (sftp) =>
      new Promise((resolve, reject) => {
        sftp.writeFile(path, data, (err) => (err ? reject(err) : resolve()));
      }),
  );
}

export function sftpMkdir(server: SshServer, path: string): Promise<void> {
  return withSFTP(
    server,
    (sftp) =>
      new Promise((resolve, reject) => {
        sftp.mkdir(path, (err) => (err ? reject(err) : resolve()));
      }),
  );
}

export function sftpRename(
  server: SshServer,
  from: string,
  to: string,
): Promise<void> {
  return withSFTP(
    server,
    (sftp) =>
      new Promise((resolve, reject) => {
        sftp.rename(from, to, (err) => (err ? reject(err) : resolve()));
      }),
  );
}

export function sftpChmod(
  server: SshServer,
  path: string,
  mode: number,
): Promise<void> {
  return withSFTP(
    server,
    (sftp) =>
      new Promise((resolve, reject) => {
        sftp.chmod(path, mode, (err) => (err ? reject(err) : resolve()));
      }),
  );
}

/** Remove a file or (empty) directory, choosing the right call from its stat. */
export function sftpRemove(server: SshServer, path: string): Promise<void> {
  return withSFTP(
    server,
    (sftp) =>
      new Promise((resolve, reject) => {
        sftp.stat(path, (statErr, stats) => {
          if (statErr) return reject(statErr);
          const done = (err: Error | null | undefined) =>
            err ? reject(err) : resolve();
          if (stats.isDirectory()) sftp.rmdir(path, done);
          else sftp.unlink(path, done);
        });
      }),
  );
}
