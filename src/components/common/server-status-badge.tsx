"use client";

import { RiShieldCheckLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";

import { useT } from "@/components/common/i18n-provider";

/** Host-key verification status pill, shared by the overview card and server header. */
export function ServerStatusBadge({ verified }: { verified: boolean }) {
  const t = useT();
  return verified ? (
    <Badge variant="secondary" className="gap-1">
      <RiShieldCheckLine className="size-3" />
      {t("servers.verified")}
    </Badge>
  ) : (
    <Badge variant="outline">{t("servers.untested")}</Badge>
  );
}
