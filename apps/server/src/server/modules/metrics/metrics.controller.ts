import { Elysia, t } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import { metricsService } from "./metrics.service";

export const metricsController = new Elysia({ prefix: "/servers/:id" })
  .use(authPlugin)
  .get(
    "/metrics",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await metricsService.collect(server);
      } catch (err) {
        return status(502, {
          error: err instanceof Error ? err.message : "SSH connection failed",
        });
      }
    },
    { auth: true },
  )
  .get(
    "/metrics/history",
    async ({ params, user, status, query }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      const hours = Math.min(168, Math.max(1, parseInt(query.hours ?? "24", 10) || 24));
      return metricsService.history(server.id, hours);
    },
    { auth: true, query: t.Object({ hours: t.Optional(t.String()) }) },
  );
