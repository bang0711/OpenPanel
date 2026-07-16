import { Elysia } from "elysia";

import { authorize } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { grantBody } from "./access-mgmt.schema";
import { accessMgmtService } from "./access-mgmt.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "Request failed";
}

export const accessController = new Elysia({
  prefix: "/servers/:id/access",
})
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      return accessMgmtService.list(gate.server.id);
    },
    { auth: true },
  )

  .post(
    "/",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      writeAudit(user.id, "access.grant", gate.server.id);
      try {
        return await accessMgmtService.grant(
          gate.server.id,
          body.email,
          body.level,
        );
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: grantBody },
  )

  .delete(
    "/:permId",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const ok = await accessMgmtService.revoke(gate.server.id, params.permId);
      if (!ok) return status(404, { error: "Not found" });
      writeAudit(user.id, "access.revoke", gate.server.id);
      return { ok: true };
    },
    { auth: true },
  );
