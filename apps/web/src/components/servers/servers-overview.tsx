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
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";

import { AddServerDialog } from "./add-server-dialog";
import { ServerCard, type ServerCardData } from "./server-card";

export function ServersOverview({ servers }: { servers: ServerCardData[] }) {
  const t = useT();

  return (
    <PageShell>
      <PageHeader title={t("servers.title")} description={t("servers.subtitle")}>
        <AddServerDialog />
      </PageHeader>

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {servers.map((s) => (
            <ServerCard key={s.id} server={s} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
