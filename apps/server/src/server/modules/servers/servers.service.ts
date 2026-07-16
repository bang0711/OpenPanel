import { encryptSecret } from "@/lib/crypto";
import { type SshServer,testConnection } from "@/lib/ssh/client";
import { prisma } from "@/db/prisma";
import type { AuthUser } from "@/server/access";

import { DEFAULT_SSH_PORT } from "./servers.constant";
import type { CreateServerBody } from "./servers.schema";

type ServerRow = {
  id: string;
  ownerId: string;
  name: string;
  host: string;
  port: number;
  username: string;
  authType: string;
  hostFingerprint: string | null;
  tags: string[];
  createdAt: Date;
};

export class ServersService {
  /** Strip secret columns before returning a server to the client. */
  sanitize(s: ServerRow) {
    return {
      id: s.id,
      ownerId: s.ownerId,
      name: s.name,
      host: s.host,
      port: s.port,
      username: s.username,
      authType: s.authType,
      hostFingerprint: s.hostFingerprint,
      tags: s.tags,
      createdAt: s.createdAt,
    };
  }

  async list(user: AuthUser) {
    const servers = await prisma.server.findMany({
      where: user.role === "admin" ? {} : { ownerId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return servers.map((s) => this.sanitize(s));
  }

  async create(user: AuthUser, body: CreateServerBody) {
    const server = await prisma.server.create({
      data: {
        ownerId: user.id,
        name: body.name,
        host: body.host,
        port: body.port ?? DEFAULT_SSH_PORT,
        username: body.username,
        authType: body.authType,
        secretEnc: encryptSecret(body.secret),
        passphraseEnc: body.passphrase ? encryptSecret(body.passphrase) : null,
        tags: body.tags ?? [],
      },
    });
    return this.sanitize(server);
  }

  async setTags(id: string, tags: string[]) {
    const server = await prisma.server.update({
      where: { id },
      data: { tags },
    });
    return this.sanitize(server);
  }

  async remove(id: string) {
    await prisma.server.delete({ where: { id } });
    return { ok: true };
  }

  /** Test connectivity and pin the host-key fingerprint on first success (TOFU). */
  async testAndPin(
    server: SshServer & { id: string; hostFingerprint: string | null },
  ) {
    const { ok, fingerprint } = await testConnection(server);
    const shouldPin = !server.hostFingerprint && !!fingerprint;
    if (shouldPin) {
      await prisma.server.update({
        where: { id: server.id },
        data: { hostFingerprint: fingerprint },
      });
    }
    return { ok, fingerprint, pinned: shouldPin };
  }
}

export const serversService = new ServersService();
