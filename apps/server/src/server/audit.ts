import { prisma } from "@/db/prisma";

// Fire-and-forget audit trail for privileged actions. Never blocks/throws.
export function writeAudit(
  userId: string,
  action: string,
  serverId?: string | null,
  detail?: string | null,
): void {
  prisma.auditLog
    .create({
      data: {
        userId,
        action,
        serverId: serverId ?? null,
        detail: detail ?? null,
      },
    })
    .catch(() => {});
}
