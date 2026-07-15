import { RiServerLine } from "@remixicon/react";

import { getSession } from "@/lib/session";
import { prisma } from "@/db/prisma";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { AddServerDialog } from "@/components/servers/add-server-dialog";
import { ServerCard } from "@/components/servers/server-card";

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

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Servers</h1>
          <p className="text-xs text-muted-foreground">
            Manage your registered remote hosts.
          </p>
        </div>
        <AddServerDialog />
      </div>

      {servers.length === 0 ? (
        <Empty className="rounded-lg border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <RiServerLine />
            </EmptyMedia>
            <EmptyTitle>No servers yet</EmptyTitle>
            <EmptyDescription>
              Register a remote Linux host to manage it over SSH.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddServerDialog />
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {servers.map((s) => (
            <ServerCard key={s.id} server={s} />
          ))}
        </div>
      )}
    </div>
  );
}
