import { signTicket } from "@/lib/terminal-ticket";

export class TerminalService {
  /** Mint a short-lived ticket authorizing a terminal session on one server. */
  mintTicket(userId: string, serverId: string) {
    return { ticket: signTicket(userId, serverId) };
  }
}

export const terminalService = new TerminalService();
