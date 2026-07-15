import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import {
  createDbBody,
  createUserBody,
  dropDbBody,
  engineQuery,
  grantBody,
} from "./db.schema";
import { dbService } from "./db.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const dbController = new Elysia({ prefix: "/servers/:id/db" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await dbService.detect(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .get(
    "/databases",
    async ({ params, query, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await dbService.listDatabases(server, query.engine);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true, query: engineQuery },
  )

  .post(
    "/database",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "db.createDatabase", server.id);
      try {
        return await dbService.createDatabase(server, body.engine, body.name);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: createDbBody },
  )

  .delete(
    "/database",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "db.dropDatabase", server.id);
      try {
        return await dbService.dropDatabase(server, body.engine, body.name);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: dropDbBody },
  )

  .post(
    "/user",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "db.createUser", server.id);
      try {
        return await dbService.createUser(
          server,
          body.engine,
          body.username,
          body.password,
        );
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: createUserBody },
  )

  .post(
    "/grant",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "db.grant", server.id);
      try {
        return await dbService.grant(
          server,
          body.engine,
          body.username,
          body.database,
        );
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: grantBody },
  );
