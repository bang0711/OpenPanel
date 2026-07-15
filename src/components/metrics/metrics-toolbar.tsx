"use client";

import { RiShieldCheckLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

import { RefreshButton } from "@/components/common/refresh-button";

export function MetricsToolbar({
  subtitle,
  testing,
  onTest,
  onRefresh,
}: {
  subtitle: string;
  testing: boolean;
  onTest: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{subtitle || " "}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onTest} disabled={testing}>
          <RiShieldCheckLine />
          {testing ? "Testing…" : "Test connection"}
        </Button>
        <RefreshButton onClick={onRefresh} />
      </div>
    </div>
  );
}
