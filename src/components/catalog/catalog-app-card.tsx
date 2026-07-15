"use client";

import { memo } from "react";
import { RiCheckLine, RiDownloadLine } from "@remixicon/react";

import type { CatalogApp } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useT } from "@/components/common/i18n-provider";

// Memoized so re-renders during install only touch the affected card.
export const CatalogAppCard = memo(function CatalogAppCard({
  app,
  installed,
  installing,
  onInstall,
}: {
  app: CatalogApp;
  installed: boolean;
  installing: boolean;
  onInstall: () => void;
}) {
  const t = useT();
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm">{app.name}</CardTitle>
        <Badge variant="outline" className="text-[0.625rem]">
          {app.category}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{app.description}</p>
        {installed ? (
          <Button size="sm" variant="secondary" disabled className="w-full">
            <RiCheckLine />
            {t("catalog.installedLabel")}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            disabled={installing}
            onClick={onInstall}
          >
            <RiDownloadLine />
            {installing ? t("common.installing") : t("common.install")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
});
