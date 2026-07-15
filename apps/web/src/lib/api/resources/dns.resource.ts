import { request } from "../http";
import type { DnsStatus, DnsZone } from "./dns.type";

type Result = { ok: boolean; output: string };

// Paths inlined (not added to the shared endpoint registry) — one base here.
const base = (id: string) => `/servers/${id}/dns`;

export class DnsResource {
  status(serverId: string) {
    return request<DnsStatus>("GET", base(serverId));
  }
  read(serverId: string, path: string) {
    return request<DnsZone>("GET", `${base(serverId)}/zone`, {
      query: { path },
    });
  }
  write(serverId: string, path: string, content: string, zoneName?: string) {
    return request<Result>("POST", `${base(serverId)}/zone`, {
      body: { path, content, zoneName },
    });
  }
}
