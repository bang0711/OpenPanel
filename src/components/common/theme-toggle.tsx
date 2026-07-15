"use client";

import { useTheme } from "next-themes";
import { RiComputerLine, RiMoonLine, RiSunLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ActionTooltip } from "@/components/common/action-tooltip";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <ActionTooltip label="Theme">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <RiSunLine className="dark:hidden" />
            <RiMoonLine className="hidden dark:block" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
      </ActionTooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <RiSunLine />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <RiMoonLine />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <RiComputerLine />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
