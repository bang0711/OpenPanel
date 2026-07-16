import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { OsIcon } from "@/components/common/os-icon";
import { ServerStatusBadge } from "@/components/common/server-status-badge";

export type ServerCardData = {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  hostFingerprint: string | null;
  osId: string | null;
  osName: string | null;
};

export function ServerCard({ server }: { server: ServerCardData }) {
  return (
    <Link href={`/servers/${server.id}`}>
      <Card className="transition-colors hover:border-ring">
        <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
            <OsIcon osId={server.osId} brandColor />
            <span className="truncate">{server.name}</span>
          </CardTitle>
          <ServerStatusBadge verified={!!server.hostFingerprint} />
        </CardHeader>
        <CardContent className="space-y-0.5 text-xs text-muted-foreground">
          <p className="truncate">
            {server.username}@{server.host}:{server.port}
          </p>
          {server.osName && <p className="truncate">{server.osName}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
