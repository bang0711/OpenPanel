import { Elysia } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import { createServerBody } from "./servers.schema";
import { serversService } from "./servers.service";

export const serversController = new Elysia({ prefix: "/servers" })
  .use(authPlugin)

  .get("/", ({ user }) => serversService.list(user), { auth: true })

  .post("/", ({ user, body }) => serversService.create(user, body), {
    auth: true,
    body: createServerBody,
  })

  .get(
    "/:id",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      return serversService.sanitize(server);
    },
    { auth: true },
  )

  .delete(
    "/:id",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      return serversService.remove(server.id);
    },
    { auth: true },
  )

  .post(
    "/:id/test",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await serversService.testAndPin(server);
      } catch (err) {
        return status(400, {
          error: err instanceof Error ? err.message : "Connection failed",
        });
      }
    },
    { auth: true },
  );
