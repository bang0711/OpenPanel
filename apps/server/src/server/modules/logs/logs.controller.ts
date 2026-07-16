import { Elysia } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import { tailQuery } from "./logs.schema";
import { logsService } from "./logs.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const logsController = new Elysia({ prefix: "/servers/:id/logs" })
  .use(authPlugin)

  .get(
    "/sources",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      return logsService.sources();
    },
    { auth: true },
  )

  .get(
    "/",
    async ({ params, query, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      const lines = parseInt(query.lines ?? "", 10);
      try {
        return await logsService.tail(server, query.source, lines, query.unit);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true, query: tailQuery },
  );
