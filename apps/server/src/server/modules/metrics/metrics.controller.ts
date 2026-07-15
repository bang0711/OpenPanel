import { Elysia } from "elysia";

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
  );
