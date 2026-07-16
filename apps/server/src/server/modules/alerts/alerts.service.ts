import { prisma } from "@/db/prisma";

import {
  isValidTarget,
  METRICS,
  OPS,
  type Metric,
  type Op,
} from "./alerts.constant";

type CreateInput = {
  metric: string;
  op: string;
  threshold: number;
  target?: string;
  channelId?: string;
};

export class AlertsService {
  list(serverId: string) {
    return prisma.alertRule.findMany({
      where: { serverId },
      orderBy: { createdAt: "desc" },
    });
  }

  get(id: string) {
    return prisma.alertRule.findUnique({ where: { id } });
  }

  channels(userId: string) {
    return prisma.notificationChannel.findMany({
      where: { userId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    });
  }

  create(userId: string, serverId: string, body: CreateInput) {
    if (!METRICS.includes(body.metric as Metric))
      throw new Error("Invalid metric");
    if (!OPS.includes(body.op as Op)) throw new Error("Invalid operator");
    if (typeof body.threshold !== "number" || Number.isNaN(body.threshold))
      throw new Error("Invalid threshold");

    const target = body.target?.trim() || undefined;
    if (body.metric === "service" && !target)
      throw new Error("Target service is required");
    if (target && !isValidTarget(target)) throw new Error("Invalid target");

    return prisma.alertRule.create({
      data: {
        userId,
        serverId,
        metric: body.metric,
        op: body.op,
        threshold: body.threshold,
        target: target ?? null,
        channelId: body.channelId || null,
      },
    });
  }

  setEnabled(id: string, enabled: boolean) {
    return prisma.alertRule.update({ where: { id }, data: { enabled } });
  }

  remove(id: string) {
    return prisma.alertRule.delete({ where: { id } });
  }
}

export const alertsService = new AlertsService();
