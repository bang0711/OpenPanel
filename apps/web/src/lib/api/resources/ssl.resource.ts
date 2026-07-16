import { request } from "../http";
import type { SslStatus } from "./ssl.type";

type Result = { ok: boolean; output: string };

const base = (serverId: string) => `/servers/${serverId}/ssl`;

export class SslResource {
  status(serverId: string) {
    return request<SslStatus>("GET", base(serverId));
  }
  issue(serverId: string, domain: string, email: string) {
    return request<Result>("POST", `${base(serverId)}/issue`, {
      body: { domain, email },
    });
  }
  renew(serverId: string) {
    return request<Result>("POST", `${base(serverId)}/renew`);
  }
}
