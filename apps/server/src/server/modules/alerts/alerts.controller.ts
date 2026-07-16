import { Elysia, t } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { createBody } from "./alerts.schema";
import { alertsService } from "./alerts.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "Request failed";
}

export const alertsController = new Elysia({ prefix: "/servers/:id/alerts" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      return {
        rules: await alertsService.list(server.id),
        channels: await alertsService.channels(user.id),
      };
    },
    { auth: true },
  )

  .post(
    "/",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "alerts.create", server.id);
      try {
        return await alertsService.create(user.id, server.id, body);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: createBody },
  )

  .patch(
    "/:ruleId",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const rule = await alertsService.get(params.ruleId);
      if (!rule || rule.serverId !== params.id)
        return status(404, { error: "Not found" });
      writeAudit(user.id, "alerts.toggle", gate.server.id);
      try {
        return await alertsService.setEnabled(params.ruleId, body.enabled);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: t.Object({ enabled: t.Boolean() }) },
  )

  .delete(
    "/:ruleId",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const rule = await alertsService.get(params.ruleId);
      if (!rule || rule.serverId !== params.id)
        return status(404, { error: "Not found" });
      writeAudit(user.id, "alerts.remove", gate.server.id);
      try {
        return await alertsService.remove(params.ruleId);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  );
