"use client";

import { RiShieldCheckLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

import { useT } from "@/components/common/i18n-provider";
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
  const t = useT();
  return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-muted-foreground">{subtitle || " "}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onTest} disabled={testing}>
          <RiShieldCheckLine />
          {testing ? t("metrics.testing") : t("metrics.testConnection")}
        </Button>
        <RefreshButton onClick={onRefresh} />
      </div>
    </div>
  );
}
