import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { catalogController } from "@/server/modules/catalog/catalog.controller";
import { cronController } from "@/server/modules/cron/cron.controller";
import { filesController } from "@/server/modules/files/files.controller";
import { firewallController } from "@/server/modules/firewall/firewall.controller";
import { metricsController } from "@/server/modules/metrics/metrics.controller";
import { packagesController } from "@/server/modules/packages/packages.controller";
import { serversController } from "@/server/modules/servers/servers.controller";
import { servicesController } from "@/server/modules/services/services.controller";
import { terminalController } from "@/server/modules/terminal/terminal.controller";
import { terminalWsController } from "@/server/modules/terminal/terminal.ws";

// Single Elysia app mounted into a Next catch-all Route Handler.
// Everything under /api except /api/auth/* (handled by Better Auth's own route).
export const app = new Elysia({ prefix: "/api" })
  // Scalar API reference at /api/docs, OpenAPI spec at /api/docs/json.
  .use(
    openapi({
      path: "/docs",
      provider: "scalar",
      documentation: {
        info: {
          title: "OpenPanel API",
          version: "0.1.0",
          description: "Remote Linux server management API.",
        },
      },
    }),
  )
  .onError(({ code, error, status }) => {
    if (code === "VALIDATION") return status(422, { error: "Invalid input" });
    if (code === "NOT_FOUND") return status(404, { error: "Not found" });
    return status(500, {
      error: error instanceof Error ? error.message : "Internal error",
    });
  })
  .use(serversController)
  .use(metricsController)
  .use(servicesController)
  .use(filesController)
  .use(terminalController)
  .use(terminalWsController)
  .use(packagesController)
  .use(catalogController)
  .use(cronController)
  .use(firewallController);

export type App = typeof app;
