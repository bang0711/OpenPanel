import { Elysia } from "elysia";

import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { createTokenBody } from "./tokens.schema";
import { tokensService } from "./tokens.service";

export const tokensController = new Elysia({ prefix: "/tokens" })
  .use(authPlugin)

  .get("/", ({ user }) => tokensService.list(user.id), { auth: true })

  .post(
    "/",
    async ({ user, body }) => {
      const result = await tokensService.create(user.id, body.name);
      writeAudit(user.id, "tokens.create");
      return result;
    },
    { auth: true, body: createTokenBody },
  )

  .delete(
    "/:id",
    async ({ user, params, status }) => {
      const ok = await tokensService.remove(user.id, params.id);
      if (!ok) return status(404, { error: "Not found" });
      writeAudit(user.id, "tokens.revoke");
      return { ok: true };
    },
    { auth: true },
  );
