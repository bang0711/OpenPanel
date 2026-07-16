import { Elysia } from "elysia";

import { authorize } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { terminalService } from "./terminal.service";

export const terminalController = new Elysia({ prefix: "/servers/:id" })
  .use(authPlugin)
  .post(
    "/terminal-ticket",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "terminal.ticket", server.id);
      return terminalService.mintTicket(user.id, server.id);
    },
    { auth: true },
  );
