import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type {
  CommandResult,
  KillSignalName,
  ProcessInfo,
  ServiceActionName,
  ServiceUnit,
} from "./services.type";

export class ServicesResource {
  list(serverId: string) {
    return request<ServiceUnit[]>("GET", API_ENDPOINT.SERVICES.ROOT(serverId));
  }
  action(serverId: string, unit: string, action: ServiceActionName) {
    return request<CommandResult>(
      "POST",
      API_ENDPOINT.SERVICES.ACTION(serverId, unit),
      { body: { action } },
    );
  }
  logs(serverId: string, unit: string, lines?: number) {
    return request<{ logs: string }>(
      "GET",
      API_ENDPOINT.SERVICES.LOGS(serverId, unit),
      { query: { lines } },
    );
  }
  processes(serverId: string) {
    return request<ProcessInfo[]>(
      "GET",
      API_ENDPOINT.SERVICES.PROCESSES(serverId),
    );
  }
  kill(serverId: string, pid: number, signal: KillSignalName) {
    return request<CommandResult>(
      "POST",
      API_ENDPOINT.SERVICES.PROCESS_KILL(serverId, pid),
      { body: { signal } },
    );
  }
}
