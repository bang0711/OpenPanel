import { prisma } from "@/db/prisma";

export class AuditService {
  /** Latest audit rows (clamped) with the acting user's email joined in. */
  async list(limitRaw?: string) {
    const parsed = Number.parseInt(limitRaw ?? "", 10);
    const limit = Number.isFinite(parsed)
      ? Math.min(Math.max(parsed, 1), 500)
      : 100;

    const rows = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        detail: true,
        serverId: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    });

    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      detail: r.detail,
      serverId: r.serverId,
      userEmail: r.user.email,
      createdAt: r.createdAt,
    }));
  }
}

export const auditService = new AuditService();
