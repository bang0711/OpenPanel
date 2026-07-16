import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { issueBody } from "./ssl.schema";
import { sslService } from "./ssl.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const sslController = new Elysia({
  prefix: "/servers/:id/ssl",
})
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await sslService.list(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/issue",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "ssl.issue", server.id);
      try {
        return await sslService.issue(server, body.domain, body.email);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: issueBody },
  )

  .post(
    "/renew",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "ssl.renew", server.id);
      try {
        return await sslService.renew(server);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  );
