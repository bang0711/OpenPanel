import { request } from "../http";
import type { VhostStatus } from "./vhost.type";

type Result = { ok: boolean; output: string };

// Paths inlined (not added to the shared endpoint registry) — one base here.
const base = (id: string) => `/servers/${id}/vhost`;

export class VhostResource {
  status(serverId: string) {
    return request<VhostStatus>("GET", base(serverId));
  }
  read(serverId: string, name: string) {
    return request<{ content: string }>(
      "GET",
      `${base(serverId)}/site/${encodeURIComponent(name)}`,
    );
  }
  write(serverId: string, name: string, content: string) {
    return request<Result>("POST", `${base(serverId)}/site`, {
      body: { name, content },
    });
  }
  enable(serverId: string, name: string) {
    return request<Result>("POST", `${base(serverId)}/enable`, {
      body: { name },
    });
  }
  disable(serverId: string, name: string) {
    return request<Result>("POST", `${base(serverId)}/disable`, {
      body: { name },
    });
  }
}
