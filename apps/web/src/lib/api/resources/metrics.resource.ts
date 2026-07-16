import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { MetricHistoryPoint, ServerMetrics } from "./metrics.type";

export class MetricsResource {
  get(serverId: string) {
    return request<ServerMetrics>("GET", API_ENDPOINT.METRICS.ROOT(serverId));
  }

  history(serverId: string, hours?: number) {
    return request<MetricHistoryPoint[]>(
      "GET",
      API_ENDPOINT.METRICS.HISTORY(serverId),
      { query: { hours } },
    );
  }
}
