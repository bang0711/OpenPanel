import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { addBody } from "./ssh-keys.schema";
import { sshKeysService } from "./ssh-keys.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const sshKeysController = new Elysia({ prefix: "/servers/:id/ssh-keys" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await sshKeysService.list(server);
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
      writeAudit(user.id, "sshKeys.add", server.id);
      try {
        return await sshKeysService.add(server, body.publicKey);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: addBody },
  )

  .delete(
    "/:index",
    async ({ params, user, status }) => {
      const idx = Number(params.index);
      if (!Number.isInteger(idx) || idx < 0)
        return status(400, { error: "Invalid index" });
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "sshKeys.remove", server.id);
      try {
        return await sshKeysService.remove(server, idx);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  );
