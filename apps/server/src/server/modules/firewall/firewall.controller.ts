import { Elysia } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import { ruleBody } from "./firewall.schema";
import { firewallService } from "./firewall.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const firewallController = new Elysia({
  prefix: "/servers/:id/firewall",
})
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await firewallService.status(server);
      } catch (err) {
        return status(502, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/rule",
    async ({ params, body, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await firewallService.setRule(
          server,
          body.action,
          body.port,
          body.protocol,
        );
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: ruleBody },
  )

  .delete(
    "/rule/:num",
    async ({ params, user, status }) => {
      const num = Number(params.num);
      if (!Number.isInteger(num) || num < 1)
        return status(400, { error: "Invalid rule" });
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await firewallService.deleteRule(server, num);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/enable",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await firewallService.enable(server);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .post(
    "/disable",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await firewallService.disable(server);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  );
