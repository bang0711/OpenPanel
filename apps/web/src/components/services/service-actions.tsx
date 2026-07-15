"use client";

import {
  RiCheckboxCircleLine,
  RiFileTextLine,
  RiForbidLine,
  RiLoopRightLine,
  RiMore2Line,
  RiPlayLine,
  RiStopLine,
} from "@remixicon/react";

import type { ServiceActionName } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ActionTooltip } from "@/components/common/action-tooltip";
import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";

export function ServiceActions({
  unit,
  busyKey,
  onAction,
  onLogs,
}: {
  unit: string;
  busyKey: string | null;
  onAction: (action: ServiceActionName) => void;
  onLogs: () => void;
}) {
  const t = useT();
  const busy = (a: string) => busyKey === unit + a;

  return (
    <div className="flex justify-end gap-1">
      <IconButton
        label={t("services.action.start")}
        onClick={() => onAction("start")}
        disabled={busy("start")}
      >
        <RiPlayLine />
      </IconButton>
      <IconButton
        label={t("services.action.restart")}
        onClick={() => onAction("restart")}
        disabled={busy("restart")}
      >
        <RiLoopRightLine />
      </IconButton>
      <IconButton
        label={t("services.action.stop")}
        onClick={() => onAction("stop")}
        disabled={busy("stop")}
      >
        <RiStopLine />
      </IconButton>
      <IconButton label={t("services.action.logs")} onClick={onLogs}>
        <RiFileTextLine />
      </IconButton>
      <DropdownMenu>
        <ActionTooltip label={t("services.action.more")}>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost">
              <RiMore2Line />
            </Button>
          </DropdownMenuTrigger>
        </ActionTooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAction("enable")}>
            <RiCheckboxCircleLine />
            {t("services.action.enable")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("disable")}>
            <RiForbidLine />
            {t("services.action.disable")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
