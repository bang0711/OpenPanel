import { prisma } from "@/db/prisma";

export class ChannelsService {
  list(userId: string) {
    return prisma.notificationChannel.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, type: true, url: true },
    });
  }

  /** Create a webhook channel. Throws if the URL scheme is not http(s). */
  create(userId: string, name: string, url: string) {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("URL must start with http:// or https://");
    }
    return prisma.notificationChannel.create({
      data: { userId, name, url, type: "webhook" },
      select: { id: true, name: true, type: true, url: true },
    });
  }

  /** Delete a channel only if it belongs to the caller. Returns false if not. */
  async remove(userId: string, id: string) {
    const row = await prisma.notificationChannel.findUnique({ where: { id } });
    if (!row || row.userId !== userId) return false;
    await prisma.notificationChannel.delete({ where: { id } });
    return true;
  }
}

export const channelsService = new ChannelsService();
