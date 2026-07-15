import { notFound } from "next/navigation";

import { getSession } from "@/lib/session";
import { loadOwnedServer } from "@/server/access";

import { ServerStatusBadge } from "@/components/common/server-status-badge";
import { ServerNav } from "@/components/servers/server-nav";

export default async function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return null;

  const server = await loadOwnedServer(id, session.user);
  if (!server) notFound();

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div>
          <h1 className="text-base font-semibold">{server.name}</h1>
          <p className="text-xs text-muted-foreground">
            {server.username}@{server.host}:{server.port}
          </p>
        </div>
        <ServerStatusBadge verified={!!server.hostFingerprint} />
      </div>
      <ServerNav serverId={id} />
      <div className="p-4">{children}</div>
    </div>
  );
}
