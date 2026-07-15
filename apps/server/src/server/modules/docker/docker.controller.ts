import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { isValidId } from "./docker.constant";
import { actionBody } from "./docker.schema";
import { dockerService } from "./docker.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const dockerController = new Elysia({ prefix: "/servers/:id/docker" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await dockerService.status(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .get(
    "/logs/:cid",
    async ({ params, user, status }) => {
      if (!isValidId(params.cid))
        return status(400, { error: "Invalid container id" });
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return { logs: await dockerService.logs(server, params.cid) };
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/action",
    async ({ params, body, user, status }) => {
      if (!isValidId(body.id))
        return status(400, { error: "Invalid container id" });
      const level = body.action === "rm" ? "admin" : "write";
      const gate = await authorize(params.id, user, level);
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "docker.action", server.id);
      try {
        return await dockerService.action(server, body.id, body.action);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true, body: actionBody },
  )

  .delete(
    "/image/:iid",
    async ({ params, user, status }) => {
      if (!isValidId(params.iid))
        return status(400, { error: "Invalid image id" });
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "docker.rmi", server.id);
      try {
        return await dockerService.removeImage(server, params.iid);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  );
