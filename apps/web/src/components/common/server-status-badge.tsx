"use client";

import { RiShieldCheckLine, RiShieldLine } from "@remixicon/react";

import { Badge } from "@/components/ui/badge";

import { ActionTooltip } from "@/components/common/action-tooltip";
import { useT } from "@/components/common/i18n-provider";

/**
 * Host-key verification status, shared by the overview card and server header.
 * `verified` means a fingerprint is pinned — NOT that the host is reachable.
 * An unpinned host accepts whatever host key it is offered, so the tooltip
 * spells out why testing matters.
 */
export function ServerStatusBadge({ verified }: { verified: boolean }) {
  const t = useT();
  return (
    <ActionTooltip
      label={verified ? t("servers.verifiedHint") : t("servers.untestedHint")}
    >
      <Badge variant={verified ? "secondary" : "outline"} className="gap-1">
        {verified ? (
          <RiShieldCheckLine className="size-3" />
        ) : (
          <RiShieldLine className="size-3" />
        )}
        {verified ? t("servers.verified") : t("servers.untested")}
      </Badge>
    </ActionTooltip>
  );
}
