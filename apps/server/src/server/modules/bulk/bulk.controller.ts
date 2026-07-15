import { Elysia } from "elysia";

import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { runBody } from "./bulk.schema";
import { bulkService } from "./bulk.service";

// Dashboard-level bulk runner. NOT server-scoped: per-server `authorize`
// happens inside the service, so there is no `loadOwnedServer` at the top.
export const bulkController = new Elysia({ prefix: "/bulk" })
  .use(authPlugin)

  .post(
    "/run",
    async ({ user, body, status }) => {
      writeAudit(user.id, `bulk.${body.action}`, null);
      try {
        const results = await bulkService.run(
          user,
          body.serverIds,
          body.action,
          body.unit,
        );
        return { results };
      } catch (err) {
        return status(400, {
          error: err instanceof Error ? err.message : "Bulk run failed",
        });
      }
    },
    { auth: true, body: runBody },
  );
