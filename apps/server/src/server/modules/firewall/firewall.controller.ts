import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
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
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "firewall.setRule", server.id);
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
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "firewall.deleteRule", server.id);
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
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "firewall.enable", server.id);
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
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "firewall.disable", server.id);
      try {
        return await firewallService.disable(server);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  );
