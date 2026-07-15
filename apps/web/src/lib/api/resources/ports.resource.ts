import { request } from "../http";
import type { OpenPort } from "./ports.type";

export class PortsResource {
  list(serverId: string) {
    return request<OpenPort[]>("GET", `/servers/${serverId}/ports`);
  }
}
