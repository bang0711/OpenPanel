import { notFound } from "next/navigation";

import type { Server } from "@/lib/api";
import { serverFetch } from "@/lib/server-fetch";
import { getSession } from "@/lib/session";

import { OsIcon } from "@/components/common/os-icon";
import { ServerStatusBadge } from "@/components/common/server-status-badge";
import { ServerHeaderActions } from "@/components/servers/server-header-actions";
import { ServerNav } from "@/components/servers/server-nav";
import { ServerNavSelect } from "@/components/servers/server-nav-select";

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

  const server = await serverFetch<Server>(`/api/servers/${id}`);
  if (!server) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b px-4 pt-4 pb-3">
        <OsIcon osId={server.osId} className="size-7" brandColor />
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold">{server.name}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {server.username}@{server.host}:{server.port}
            {server.osName ? ` · ${server.osName}` : ""}
          </p>
        </div>
        <ServerStatusBadge verified={!!server.hostFingerprint} />
        <ServerHeaderActions server={server} />
      </div>

      {/* Rail and content scroll independently; the page itself never does. */}
      <div className="flex min-h-0 flex-1">
        <ServerNav serverId={id} />
        <div className="min-w-0 flex-1 space-y-3 overflow-y-auto p-4">
          <ServerNavSelect serverId={id} />
          {children}
        </div>
      </div>
    </div>
  );
}
