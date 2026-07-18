import { openapi } from "@elysiajs/openapi";
import { Elysia } from "elysia";

import { prisma } from "@/db/prisma";

import { accessController } from "@/server/modules/access-mgmt/access-mgmt.controller";
import { alertsController } from "@/server/modules/alerts/alerts.controller";
import { auditController } from "@/server/modules/audit/audit.controller";
import { backupsController } from "@/server/modules/backups/backups.controller";
import { bulkController } from "@/server/modules/bulk/bulk.controller";
import { catalogController } from "@/server/modules/catalog/catalog.controller";
import { channelsController } from "@/server/modules/channels/channels.controller";
import { cronController } from "@/server/modules/cron/cron.controller";
import { dbController } from "@/server/modules/db/db.controller";
import { dbBackupController } from "@/server/modules/db-backup/db-backup.controller";
import { dnsController } from "@/server/modules/dns/dns.controller";
import { dockerController } from "@/server/modules/docker/docker.controller";
import { fail2banController } from "@/server/modules/fail2ban/fail2ban.controller";
import { filesController } from "@/server/modules/files/files.controller";
import { firewallController } from "@/server/modules/firewall/firewall.controller";
import { logsController } from "@/server/modules/logs/logs.controller";
import { metricsController } from "@/server/modules/metrics/metrics.controller";
import { packagesController } from "@/server/modules/packages/packages.controller";
import { portsController } from "@/server/modules/ports/ports.controller";
import { powerController } from "@/server/modules/power/power.controller";
import { proxyController } from "@/server/modules/proxy/proxy.controller";
import { queryController } from "@/server/modules/query/query.controller";
import { serversController } from "@/server/modules/servers/servers.controller";
import { servicesController } from "@/server/modules/services/services.controller";
import { sshKeysController } from "@/server/modules/ssh-keys/ssh-keys.controller";
import { sslController } from "@/server/modules/ssl/ssl.controller";
import { terminalController } from "@/server/modules/terminal/terminal.controller";
import { terminalWsController } from "@/server/modules/terminal/terminal.ws";
import { tokensController } from "@/server/modules/tokens/tokens.controller";
import { usersController } from "@/server/modules/users/users.controller";
import { vhostController } from "@/server/modules/vhost/vhost.controller";

// The interactive API reference (Scalar) is a full map of every route. It is on
// by default in dev but NOT mounted in production unless explicitly enabled, so
// /api/docs simply does not exist on a public deployment — on the frontend proxy
// AND the backend port alike (proxy.ts additionally never forwards it from the
// web origin, so even ENABLE_API_DOCS on a private box stays off the public site).
const DOCS_ENABLED =
  process.env.ENABLE_API_DOCS === "true" ||
  process.env.NODE_ENV !== "production";

// Single Elysia app mounted into a Next catch-all Route Handler.
// Everything under /api except /api/auth/* (handled by Better Auth's own route).
export const app = new Elysia({ prefix: "/api" })
  // Scalar API reference at /api/docs, OpenAPI spec at /api/docs/json — mounted
  // only when DOCS_ENABLED; otherwise a no-op plugin adds nothing.
  .use(
    DOCS_ENABLED
      ? openapi({
          path: "/docs",
          provider: "scalar",
          documentation: {
            info: {
              title: "OpenPanel API",
              version: "0.1.0",
              description: "Remote Linux server management API.",
            },
          },
        })
      : new Elysia(),
  )
  .onError(({ code, error, status }) => {
    if (code === "VALIDATION") return status(422, { error: "Invalid input" });
    if (code === "NOT_FOUND") return status(404, { error: "Not found" });
    return status(500, {
      error: error instanceof Error ? error.message : "Internal error",
    });
  })
  // Public liveness+readiness probe for the container healthcheck and CD
  // wait-for-healthy. A cheap `SELECT 1` proves the process is up AND its DB is
  // reachable — the two ways a "started" container is still not actually
  // serving. No auth: it exposes nothing and must answer before a session
  // exists. Returns 503 (not a throw) so the healthcheck reads it as unhealthy.
  .get("/health", async ({ status }) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: "ok" };
    } catch {
      return status(503, { status: "unhealthy" });
    }
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
  .use(firewallController)
  .use(portsController)
  .use(fail2banController)
  .use(sshKeysController)
  .use(logsController)
  .use(powerController)
  .use(usersController)
  .use(sslController)
  .use(dockerController)
  .use(vhostController)
  .use(proxyController)
  .use(dnsController)
  .use(dbController)
  .use(queryController)
  .use(dbBackupController)
  .use(alertsController)
  .use(backupsController)
  .use(accessController)
  .use(bulkController)
  .use(tokensController)
  .use(channelsController)
  .use(auditController);

export type App = typeof app;
