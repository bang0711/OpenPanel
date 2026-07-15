import { request } from "../http";
import type { LogSource, LogTail } from "./logs.type";

export class LogsResource {
  sources(serverId: string) {
    return request<LogSource[]>("GET", `/servers/${serverId}/logs/sources`);
  }
  tail(serverId: string, source: string, lines: number, unit?: string) {
    return request<LogTail>("GET", `/servers/${serverId}/logs`, {
      query: { source, lines, unit },
    });
  }
}
