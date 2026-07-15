import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { isValidName } from "./proxy.constant";
import { createBody } from "./proxy.schema";
import { proxyService } from "./proxy.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const proxyController = new Elysia({ prefix: "/servers/:id/proxy" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await proxyService.status(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "proxy.create", server.id);
      try {
        return await proxyService.create(server, body);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: createBody },
  )

  .delete(
    "/:name",
    async ({ params, user, status }) => {
      if (!isValidName(params.name))
        return status(400, { error: "Invalid site name" });
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "proxy.remove", server.id);
      try {
        return await proxyService.remove(server, params.name);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  );
