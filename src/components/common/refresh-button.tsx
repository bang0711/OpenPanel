"use client";

import { RiRefreshLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

import { useT } from "@/components/common/i18n-provider";

/** Small outline refresh button. Pass label="" for an icon-only variant. */
export function RefreshButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label?: string;
}) {
  const t = useT();
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      <RiRefreshLine />
      {label === undefined ? t("common.refresh") : label}
    </Button>
  );
}
