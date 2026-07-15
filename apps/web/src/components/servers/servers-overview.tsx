"use client";

import { RiServerLine } from "@remixicon/react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { useT } from "@/components/common/i18n-provider";

import { AddServerDialog } from "./add-server-dialog";
import { ServerCard, type ServerCardData } from "./server-card";

export function ServersOverview({ servers }: { servers: ServerCardData[] }) {
  const t = useT();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("servers.title")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("servers.subtitle")}
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
            <EmptyTitle>{t("servers.emptyTitle")}</EmptyTitle>
            <EmptyDescription>{t("servers.emptyDescription")}</EmptyDescription>
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
