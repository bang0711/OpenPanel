import { Elysia } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import { terminalService } from "./terminal.service";

export const terminalController = new Elysia({ prefix: "/servers/:id" })
  .use(authPlugin)
  .post(
    "/terminal-ticket",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      return terminalService.mintTicket(user.id, server.id);
    },
    { auth: true },
  );
