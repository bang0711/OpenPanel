import { Elysia } from "elysia";

import { loadOwnedServer } from "@/server/access";
import { authPlugin } from "@/server/plugins/auth";

import {
  chmodBody,
  mkdirBody,
  pathQuery,
  renameBody,
  uploadBody,
  writeBody,
} from "./files.schema";
import { filesService } from "./files.service";

function fail(err: unknown) {
  return err instanceof Error ? err.message : "SFTP error";
}

export const filesController = new Elysia({ prefix: "/servers/:id/files" })
  .use(authPlugin)

  .get(
    "/",
    async ({ params, query, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await filesService.list(server, query.path);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, query: pathQuery },
  )

  .get(
    "/content",
    async ({ params, query, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await filesService.readText(server, query.path);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, query: pathQuery },
  )

  .put(
    "/content",
    async ({ params, body, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await filesService.writeText(server, body.path, body.content);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: writeBody },
  )

  .post(
    "/mkdir",
    async ({ params, body, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await filesService.makeDir(server, body.path);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: mkdirBody },
  )

  .post(
    "/chmod",
    async ({ params, body, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await filesService.chmod(server, body.path, body.mode);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: chmodBody },
  )

  .post(
    "/rename",
    async ({ params, body, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await filesService.rename(server, body.from, body.to);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: renameBody },
  )

  .post(
    "/upload",
    async ({ params, body, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        const data = Buffer.from(await body.file.arrayBuffer());
        return await filesService.upload(
          server,
          body.path,
          body.file.name,
          data,
        );
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, body: uploadBody },
  )

  .delete(
    "/",
    async ({ params, query, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        return await filesService.remove(server, query.path);
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, query: pathQuery },
  )

  .get(
    "/download",
    async ({ params, query, user, status }) => {
      const server = await loadOwnedServer(params.id, user);
      if (!server) return status(404, { error: "Not found" });
      try {
        const { buffer, filename } = await filesService.download(
          server,
          query.path,
        );
        return new Response(new Uint8Array(buffer), {
          headers: {
            "content-type": "application/octet-stream",
            "content-disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
          },
        });
      } catch (err) {
        return status(400, { error: fail(err) });
      }
    },
    { auth: true, query: pathQuery },
  );
