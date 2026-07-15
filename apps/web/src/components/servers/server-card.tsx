import Link from "next/link";
import { RiServerLine } from "@remixicon/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ServerStatusBadge } from "@/components/common/server-status-badge";

export type ServerCardData = {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  hostFingerprint: string | null;
};

export function ServerCard({ server }: { server: ServerCardData }) {
  return (
    <Link href={`/servers/${server.id}`}>
      <Card className="transition-colors hover:border-ring">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex items-center gap-2 text-sm">
            <RiServerLine className="size-4 text-muted-foreground" />
            {server.name}
          </CardTitle>
          <ServerStatusBadge verified={!!server.hostFingerprint} />
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {server.username}@{server.host}:{server.port}
        </CardContent>
      </Card>
    </Link>
  );
}
