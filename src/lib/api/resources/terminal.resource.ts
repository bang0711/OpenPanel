import { API_ENDPOINT } from "../endpoint.constant";
import { request } from "../http";
import type { TicketResponse } from "./terminal.type";

export class TerminalResource {
  ticket(serverId: string) {
    return request<TicketResponse>(
      "POST",
      API_ENDPOINT.SERVERS.TERMINAL_TICKET(serverId),
    );
  }
}
