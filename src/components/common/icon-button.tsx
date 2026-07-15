"use client";

import { Button } from "@/components/ui/button";

import { ActionTooltip } from "./action-tooltip";

/**
 * Ghost, square icon button with a shadcn tooltip (no native title).
 * `label` is the tooltip text. Supports asChild (e.g. for links).
 */
export function IconButton({
  label,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { label: string }) {
  return (
    <ActionTooltip label={label}>
      <Button size="icon-sm" variant="ghost" {...props}>
        {children}
      </Button>
    </ActionTooltip>
  );
}
