import { request } from "../http";
import type { SysUser } from "./users.type";

// ponytail: endpoint.constant.ts is a shared registry left untouched here, so
// the two user paths are built inline. Fold into API_ENDPOINT.USERS if it grows.
const base = (id: string) => `/servers/${id}/users`;

export class UsersResource {
  list(serverId: string) {
    return request<SysUser[]>("GET", base(serverId));
  }
  create(serverId: string, username: string, shell?: string) {
    return request<{ ok: true; output: string }>("POST", base(serverId), {
      body: { username, shell },
    });
  }
  remove(serverId: string, username: string) {
    return request<{ ok: true; output: string }>(
      "DELETE",
      `${base(serverId)}/${encodeURIComponent(username)}`,
    );
  }
  setSudo(serverId: string, username: string, enable: boolean) {
    return request<{ ok: true; output: string }>(
      "POST",
      `${base(serverId)}/sudo`,
      { body: { username, enable } },
    );
  }
}
