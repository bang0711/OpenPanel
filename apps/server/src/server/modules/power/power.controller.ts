import { Elysia } from "elysia";

import { authorize } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { powerService } from "./power.service";

export const powerController = new Elysia({
  prefix: "/servers/:id/power",
})
  .use(authPlugin)

  .post(
    "/reboot",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "power.reboot", server.id);
      try {
        return await powerService.reboot(server);
      } catch {
        return { ok: true };
      }
    },
    { auth: true },
  )

  .post(
    "/shutdown",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const server = gate.server;
      writeAudit(user.id, "power.shutdown", server.id);
      try {
        return await powerService.shutdown(server);
      } catch {
        return { ok: true };
      }
    },
    { auth: true },
  );
