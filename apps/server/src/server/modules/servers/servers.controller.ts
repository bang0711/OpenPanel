import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { createServerBody, tagsBody, updateServerBody } from "./servers.schema";
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
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "server.delete", server.id);
      return serversService.remove(server.id);
    },
    { auth: true },
  )

  .post(
    "/:id/test",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "server.test", server.id);
      try {
        return await serversService.testAndPin(server);
      } catch (err) {
        return status(400, {
          error: err instanceof Error ? err.message : "Connection failed",
        });
      }
    },
    { auth: true },
  )

  .patch(
    "/:id",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const result = await serversService.update(gate.server.id, body, gate.server);
      if ("error" in result) return status(400, { error: result.error });
      writeAudit(user.id, "server.update", gate.server.id);
      return result;
    },
    { auth: true, body: updateServerBody },
  )

  .patch(
    "/:id/tags",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      writeAudit(user.id, "server.setTags", gate.server.id);
      return serversService.setTags(gate.server.id, body.tags);
    },
    { auth: true, body: tagsBody },
  );
