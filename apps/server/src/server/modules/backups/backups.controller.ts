import { Elysia } from "elysia";

import { authorize, loadOwnedServer } from "@/server/access";
import { writeAudit } from "@/server/audit";
import { authPlugin } from "@/server/plugins/auth";

import { createBody, toggleBody } from "./backups.schema";
import { backupService } from "./backups.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SSH connection failed";
}

export const backupsController = new Elysia({ prefix: "/servers/:id/backups" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      return backupService.list(server.id);
    },
    { auth: true },
  )

  .post(
    "/",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      writeAudit(user.id, "backups.create", gate.server.id);
      try {
        return await backupService.create(user.id, gate.server.id, body);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: createBody },
  )

  .patch(
    "/:jobId",
    async ({ params, body, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const job = await backupService.get(params.jobId);
      if (!job || job.serverId !== params.id)
        return status(404, { error: "Not found" });
      writeAudit(user.id, "backups.toggle", params.id);
      return backupService.setEnabled(job.id, body.enabled);
    },
    { auth: true, body: toggleBody },
  )

  .post(
    "/:jobId/run",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "write");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const job = await backupService.get(params.jobId);
      if (!job || job.serverId !== params.id)
        return status(404, { error: "Not found" });
      writeAudit(user.id, "backups.run", params.id);
      try {
        return await backupService.runNow(gate.server, job);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true },
  )

  .delete(
    "/:jobId",
    async ({ params, user, status }) => {
      const gate = await authorize(params.id, user, "admin");
      if (!gate.ok) return status(gate.code, { error: gate.error });
      const job = await backupService.get(params.jobId);
      if (!job || job.serverId !== params.id)
        return status(404, { error: "Not found" });
      writeAudit(user.id, "backups.remove", params.id);
      return backupService.remove(job.id);
    },
    { auth: true },
  );
