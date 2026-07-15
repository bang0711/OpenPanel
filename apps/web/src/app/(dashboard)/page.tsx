import type { Server } from "@/lib/api";
import { serverFetch } from "@/lib/server-fetch";
import { getSession } from "@/lib/session";

import { ServersOverview } from "@/components/servers/servers-overview";

export default async function OverviewPage() {
  const session = await getSession();
  if (!session) return null;

  const servers = (await serverFetch<Server[]>("/api/servers")) ?? [];

  return <ServersOverview servers={servers} />;
}
