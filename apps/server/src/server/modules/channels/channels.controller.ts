import { Elysia } from "elysia";

import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { createChannelBody } from "./channels.schema";
import { channelsService } from "./channels.service";

export const channelsController = new Elysia({ prefix: "/channels" })
  .use(authPlugin)

  .get("/", ({ user }) => channelsService.list(user.id), { auth: true })

  .post(
    "/",
    async ({ user, body, status }) => {
      try {
        const channel = await channelsService.create(
          user.id,
          body.name,
          body.url,
        );
        writeAudit(user.id, "channels.create");
        return channel;
      } catch (err) {
        return status(400, {
          error: err instanceof Error ? err.message : "Invalid channel",
        });
      }
    },
    { auth: true, body: createChannelBody },
  )

  .delete(
    "/:id",
    async ({ user, params, status }) => {
      const ok = await channelsService.remove(user.id, params.id);
      if (!ok) return status(404, { error: "Not found" });
      writeAudit(user.id, "channels.revoke");
      return { ok: true };
    },
    { auth: true },
  );
