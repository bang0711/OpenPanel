import { request } from "../http";
import type { ProxyStatus } from "./proxy.type";

type Result = { ok: boolean; output: string };

type CreateBody = {
  name: string;
  serverName: string;
  upstreamHost: string;
  upstreamPort: number;
};

// Paths inlined (not added to the shared endpoint registry) — one base here.
const base = (id: string) => `/servers/${id}/proxy`;

export class ProxyResource {
  status(serverId: string) {
    return request<ProxyStatus>("GET", base(serverId));
  }
  create(serverId: string, body: CreateBody) {
    return request<Result>("POST", base(serverId), { body });
  }
  remove(serverId: string, name: string) {
    return request<Result>(
      "DELETE",
      `${base(serverId)}/${encodeURIComponent(name)}`,
    );
  }
}
