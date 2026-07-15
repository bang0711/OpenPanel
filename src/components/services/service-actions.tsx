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
  const busy = (a: string) => busyKey === unit + a;

  return (
    <div className="flex justify-end gap-1">
      <IconButton
        label="Start"
        onClick={() => onAction("start")}
        disabled={busy("start")}
      >
        <RiPlayLine />
      </IconButton>
      <IconButton
        label="Restart"
        onClick={() => onAction("restart")}
        disabled={busy("restart")}
      >
        <RiLoopRightLine />
      </IconButton>
      <IconButton
        label="Stop"
        onClick={() => onAction("stop")}
        disabled={busy("stop")}
      >
        <RiStopLine />
      </IconButton>
      <IconButton label="Logs" onClick={onLogs}>
        <RiFileTextLine />
      </IconButton>
      <DropdownMenu>
        <ActionTooltip label="More">
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost">
              <RiMore2Line />
            </Button>
          </DropdownMenuTrigger>
        </ActionTooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onAction("enable")}>
            <RiCheckboxCircleLine />
            Enable (on boot)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAction("disable")}>
            <RiForbidLine />
            Disable (on boot)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
