import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { isValidUsername } from "./users.constant";
import { createBody, sudoBody } from "./users.schema";
import { usersService } from "./users.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const usersController = new Elysia({ prefix: "/servers/:id/users" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await usersService.list(server);
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
      writeAudit(user.id, "users.create", server.id);
      try {
        return await usersService.create(server, body.username, body.shell);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: createBody },
  )

  .post(
    "/sudo",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "users.setSudo", server.id);
      try {
        return await usersService.setSudo(server, body.username, body.enable);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: sudoBody },
  )

  .delete(
    "/:username",
    async ({ params, user, status }) => {
      if (!isValidUsername(params.username))
        return status(400, { error: "Invalid username" });
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "users.remove", server.id);
      try {
        return await usersService.remove(server, params.username);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  );
