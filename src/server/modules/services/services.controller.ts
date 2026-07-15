import { Elysia } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import { isValidUnit } from "./services.constant";
import { killBody, logsQuery,serviceActionBody } from "./services.schema";
import { servicesService } from "./services.service";

function sshError(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const servicesController = new Elysia({ prefix: "/servers/:id" })
  .use(authPlugin)

  .get(
    "/services",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await servicesService.listServices(server);
      } catch (err) {
        return status(502, { error: sshError(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/services/:name/action",
    async ({ params, body, user, status }) => {
      if (!isValidUnit(params.name))
        return status(400, { error: "Invalid service name" });
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await servicesService.action(server, params.name, body.action);
      } catch (err) {
        return status(502, { error: sshError(err) });
      }
    },
    { auth: true, body: serviceActionBody },
  )

  .get(
    "/services/:name/logs",
    async ({ params, query, user, status }) => {
      if (!isValidUnit(params.name))
        return status(400, { error: "Invalid service name" });
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        const lines = query.lines ? Number(query.lines) : 200;
        return { logs: await servicesService.logs(server, params.name, lines) };
      } catch (err) {
        return status(502, { error: sshError(err) });
      }
    },
    { auth: true, query: logsQuery },
  )

  .get(
    "/processes",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await servicesService.listProcesses(server);
      } catch (err) {
        return status(502, { error: sshError(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/processes/:pid/kill",
    async ({ params, body, user, status }) => {
      const pid = Number(params.pid);
      if (!Number.isInteger(pid) || pid <= 1)
        return status(400, { error: "Invalid pid" });
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await servicesService.kill(server, pid, body.signal);
      } catch (err) {
        return status(502, { error: sshError(err) });
      }
    },
    { auth: true, body: killBody },
  );
