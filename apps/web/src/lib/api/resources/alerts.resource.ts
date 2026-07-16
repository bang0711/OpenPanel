import { request } from "../http";
import type { AlertRule, AlertsData, CreateAlertBody } from "./alerts.type";

const base = (serverId: string) => `/servers/${serverId}/alerts`;

export class AlertsResource {
  list(serverId: string) {
    return request<AlertsData>("GET", base(serverId));
  }
  create(serverId: string, body: CreateAlertBody) {
    return request<AlertRule>("POST", base(serverId), { body });
  }
  setEnabled(serverId: string, ruleId: string, enabled: boolean) {
    return request<AlertRule>("PATCH", `${base(serverId)}/${ruleId}`, {
      body: { enabled },
    });
  }
  remove(serverId: string, ruleId: string) {
    return request<AlertRule>("DELETE", `${base(serverId)}/${ruleId}`);
  }
}
