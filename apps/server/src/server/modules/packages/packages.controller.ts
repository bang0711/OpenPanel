import { Elysia } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import { packageBody, searchQuery } from "./packages.schema";
import { packagesService } from "./packages.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const packagesController = new Elysia({ prefix: "/servers/:id/packages" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await packagesService.listInstalled(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .get(
    "/search",
    async ({ params, query, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await packagesService.search(server, query.q);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, query: searchQuery },
  )

  .post(
    "/install",
    async ({ params, body, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await packagesService.install(server, body.name);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: packageBody },
  )

  .post(
    "/remove",
    async ({ params, body, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await packagesService.remove(server, body.name);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: packageBody },
  )

  .post(
    "/refresh",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await packagesService.refresh(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  );
