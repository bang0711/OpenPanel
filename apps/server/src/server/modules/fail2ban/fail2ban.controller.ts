import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { unbanBody } from "./fail2ban.schema";
import { fail2banService } from "./fail2ban.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const fail2banController = new Elysia({
  prefix: "/servers/:id/fail2ban",
})
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await fail2banService.status(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/unban",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "fail2ban.unban", server.id);
      try {
        return await fail2banService.unban(server, body.jail, body.ip);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: unbanBody },
  );
