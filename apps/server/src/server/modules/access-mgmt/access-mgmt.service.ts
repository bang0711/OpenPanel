import { prisma } from "@/db/prisma";

import type { Level } from "./access-mgmt.constant";

export type ServerGrant = {
  id: string;
  userId: string;
  email: string;
  name: string;
  level: string;
};

export class AccessMgmtService {
  async list(serverId: string): Promise<ServerGrant[]> {
    const perms = await prisma.serverPermission.findMany({
      where: { serverId },
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return perms.map((p) => ({
      id: p.id,
      userId: p.userId,
      email: p.user.email,
      name: p.user.name,
      level: p.level,
    }));
  }

  async grant(serverId: string, email: string, level: Level) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("No such user");
    return prisma.serverPermission.upsert({
      where: { userId_serverId: { userId: user.id, serverId } },
      create: { userId: user.id, serverId, level },
      update: { level },
    });
  }

  /** Scoped delete: only removes the grant if it belongs to this server. */
  async revoke(serverId: string, permissionId: string): Promise<boolean> {
    const r = await prisma.serverPermission.deleteMany({
      where: { id: permissionId, serverId },
    });
    return r.count > 0;
  }
}

export const accessMgmtService = new AccessMgmtService();
