import { request } from "../http";
import type { ServerGrant } from "./access.type";

export class AccessResource {
  list(serverId: string) {
    return request<ServerGrant[]>("GET", `/servers/${serverId}/access`);
  }
  grant(serverId: string, email: string, level: string) {
    return request<ServerGrant>("POST", `/servers/${serverId}/access`, {
      body: { email, level },
    });
  }
  revoke(serverId: string, permId: string) {
    return request<{ ok: boolean }>(
      "DELETE",
      `/servers/${serverId}/access/${permId}`,
    );
  }
}
