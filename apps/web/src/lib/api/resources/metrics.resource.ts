import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { ServerMetrics } from "./metrics.type";

export class MetricsResource {
  get(serverId: string) {
    return request<ServerMetrics>("GET", API_ENDPOINT.METRICS.ROOT(serverId));
  }
}
