import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { runBody } from "./query.schema";
import { queryService } from "./query.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const queryController = new Elysia({ prefix: "/servers/:id/query" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await queryService.detect(server);
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
      writeAudit(user.id, "query.run", server.id);
      try {
        return await queryService.run(
          server,
          body.engine,
          body.database,
          body.sql,
        );
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: runBody },
  );
