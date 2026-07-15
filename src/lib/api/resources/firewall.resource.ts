import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { FwAction, FwProtocol, FwStatus } from "./firewall.type";

type Result = { ok: boolean; output: string };

export class FirewallResource {
  status(serverId: string) {
    return request<FwStatus>("GET", API_ENDPOINT.FIREWALL.ROOT(serverId));
  }
  setRule(
    serverId: string,
    action: FwAction,
    port: number,
    protocol?: FwProtocol,
  ) {
    return request<Result>("POST", API_ENDPOINT.FIREWALL.RULE(serverId), {
      body: { action, port, protocol },
    });
  }
  deleteRule(serverId: string, num: number) {
    return request<Result>(
      "DELETE",
      API_ENDPOINT.FIREWALL.RULE_BY_NUM(serverId, num),
    );
  }
  enable(serverId: string) {
    return request<Result>("POST", API_ENDPOINT.FIREWALL.ENABLE(serverId));
  }
  disable(serverId: string) {
    return request<Result>("POST", API_ENDPOINT.FIREWALL.DISABLE(serverId));
  }
}
