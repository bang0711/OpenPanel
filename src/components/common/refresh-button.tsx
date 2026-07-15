"use client";

import { RiRefreshLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

/** Small outline refresh button. Pass label="" for an icon-only variant. */
export function RefreshButton({
  onClick,
  label = "Refresh",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button size="sm" variant="outline" onClick={onClick}>
      <RiRefreshLine />
      {label}
    </Button>
  );
}
