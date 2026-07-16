import { Elysia, t } from "elysia";

import { authPlugin } from "@/server/plugins/auth";

import { auditService } from "./audit.service";

export const auditController = new Elysia({ prefix: "/audit" })
  .use(authPlugin)

  .get("/", ({ query }) => auditService.list(query.limit), {
    admin: true,
    query: t.Object({ limit: t.Optional(t.String()) }),
  });
