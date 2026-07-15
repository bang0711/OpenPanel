import { request } from "../http";
import type { PowerResult } from "./power.type";

// ponytail: paths inline — no shared power entry in endpoint.constant.ts.
const power = (id: string) => `/servers/${id}/power`;

export class PowerResource {
  reboot(serverId: string) {
    return request<PowerResult>("POST", `${power(serverId)}/reboot`);
  }
  shutdown(serverId: string) {
    return request<PowerResult>("POST", `${power(serverId)}/shutdown`);
  }
}
