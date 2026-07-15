import { getSession } from "@/lib/session";
import { prisma } from "@/db/prisma";

import { ServersOverview } from "@/components/servers/servers-overview";

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) return null;

  const servers = await prisma.server.findMany({
    where: session.user.role === "admin" ? {} : { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      host: true,
      port: true,
      username: true,
      hostFingerprint: true,
    },
  });

  return <ServersOverview servers={servers} />;
}
