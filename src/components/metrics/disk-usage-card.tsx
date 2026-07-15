import { RiHardDriveLine } from "@remixicon/react";

import type { DiskUsage } from "@/lib/api";
import { formatBytes } from "@/lib/format";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function DiskUsageCard({ disks }: { disks: DiskUsage[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <RiHardDriveLine className="size-4 text-muted-foreground" />
          Disk usage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {disks.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No filesystems reported.
          </p>
        )}
        {disks.map((d) => (
          <div key={d.mount} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{d.mount}</span>
              <span className="text-muted-foreground">
                {formatBytes(d.usedBytes)} / {formatBytes(d.sizeBytes)} (
                {d.usePct}%)
              </span>
            </div>
            <Progress value={d.usePct} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
