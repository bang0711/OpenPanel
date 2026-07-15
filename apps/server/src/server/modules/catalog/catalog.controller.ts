import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { installBody } from "./catalog.schema";
import { catalogService } from "./catalog.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const catalogController = new Elysia({ prefix: "/servers/:id/catalog" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return { installed: await catalogService.status(server) };
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/install",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "catalog.install", server.id);
      try {
        return await catalogService.install(server, body.id);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: installBody },
  );
