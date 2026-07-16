import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { isValidSite } from "./vhost.constant";
import { nameBody, writeBody } from "./vhost.schema";
import { vhostService } from "./vhost.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const vhostController = new Elysia({ prefix: "/servers/:id/vhost" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await vhostService.status(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .get(
    "/site/:name",
    async ({ params, user, status }) => {
      if (!isValidSite(params.name))
        return status(400, { error: "Invalid site name" });
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await vhostService.read(server, params.name);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/site",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "vhost.write", server.id);
      try {
        return await vhostService.write(server, body.name, body.content);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: writeBody },
  )

  .post(
    "/enable",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "vhost.enable", server.id);
      try {
        return await vhostService.enable(server, body.name);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: nameBody },
  )

  .post(
    "/disable",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "vhost.disable", server.id);
      try {
        return await vhostService.disable(server, body.name);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: nameBody },
  );
