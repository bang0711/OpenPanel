import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { CronJob } from "./cron.type";

export class CronResource {
  list(serverId: string) {
    return request<CronJob[]>("GET", API_ENDPOINT.CRON.ROOT(serverId));
  }
  add(serverId: string, schedule: string, command: string) {
    return request<{ ok: true }>("POST", API_ENDPOINT.CRON.ROOT(serverId), {
      body: { schedule, command },
    });
  }
  remove(serverId: string, index: number) {
    return request<{ ok: true }>(
      "DELETE",
      API_ENDPOINT.CRON.BY_INDEX(serverId, index),
    );
  }
}
