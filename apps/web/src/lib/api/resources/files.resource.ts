import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { FileListing } from "./files.type";

export class FilesResource {
  list(serverId: string, path: string) {
    return request<FileListing>("GET", API_ENDPOINT.FILES.ROOT(serverId), {
      query: { path },
    });
  }
  read(serverId: string, path: string) {
    return request<{ path: string; content: string }>(
      "GET",
      API_ENDPOINT.FILES.CONTENT(serverId),
      { query: { path } },
    );
  }
  write(serverId: string, path: string, content: string) {
    return request<{ ok: true; path: string }>(
      "PUT",
      API_ENDPOINT.FILES.CONTENT(serverId),
      { body: { path, content } },
    );
  }
  mkdir(serverId: string, path: string) {
    return request<{ ok: true; path: string }>(
      "POST",
      API_ENDPOINT.FILES.MKDIR(serverId),
      { body: { path } },
    );
  }
  chmod(serverId: string, path: string, mode: string) {
    return request<{ ok: true; path: string; mode: string }>(
      "POST",
      API_ENDPOINT.FILES.CHMOD(serverId),
      { body: { path, mode } },
    );
  }
  rename(serverId: string, from: string, to: string) {
    return request<{ ok: true }>("POST", API_ENDPOINT.FILES.RENAME(serverId), {
      body: { from, to },
    });
  }
  remove(serverId: string, path: string) {
    return request<{ ok: true }>("DELETE", API_ENDPOINT.FILES.ROOT(serverId), {
      query: { path },
    });
  }
  upload(serverId: string, dir: string, file: File) {
    const form = new FormData();
    form.set("path", dir);
    form.set("file", file);
    return request<{ ok: true; path: string }>(
      "POST",
      API_ENDPOINT.FILES.UPLOAD(serverId),
      { body: form },
    );
  }
  /** Direct URL for a download link (session cookie sent by the browser). */
  downloadUrl(serverId: string, path: string) {
    return `/api${API_ENDPOINT.FILES.DOWNLOAD(serverId, path)}`;
  }
}
