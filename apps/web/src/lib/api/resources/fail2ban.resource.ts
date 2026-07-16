import { request } from "../http";
import type { Fail2banStatus } from "./fail2ban.type";

type Result = { ok: boolean; output: string };

export class Fail2banResource {
  status(serverId: string) {
    return request<Fail2banStatus>("GET", `/servers/${serverId}/fail2ban`);
  }
  unban(serverId: string, jail: string, ip: string) {
    return request<Result>("POST", `/servers/${serverId}/fail2ban/unban`, {
      body: { jail, ip },
    });
  }
}
