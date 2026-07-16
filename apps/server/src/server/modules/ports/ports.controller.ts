import { Elysia } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import { portsService } from "./ports.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const portsController = new Elysia({
  prefix: "/servers/:id/ports",
})
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await portsService.list(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  );
