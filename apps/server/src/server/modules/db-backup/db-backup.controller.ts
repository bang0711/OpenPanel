import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { dumpBody, listQuery } from "./db-backup.schema";
import { dbBackupService } from "./db-backup.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const dbBackupController = new Elysia({
  prefix: "/servers/:id/db-backup",
})
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await dbBackupService.detect(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .get(
    "/list",
    async ({ params, query, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await dbBackupService.list(server, query.dir);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, query: listQuery },
  )

  .post(
    "/dump",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "dbBackup.dump", server.id);
      try {
        return await dbBackupService.dump(
          server,
          body.engine,
          body.database,
          body.dir,
        );
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: dumpBody },
  );
