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
import { useT } from "@/components/common/i18n-provider";

export function ThemeToggle() {
  const { setTheme } = useTheme();
  const t = useT();

  return (
    <DropdownMenu>
      <ActionTooltip label={t("common.theme")}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <RiSunLine className="dark:hidden" />
            <RiMoonLine className="hidden dark:block" />
            <span className="sr-only">{t("common.theme")}</span>
          </Button>
        </DropdownMenuTrigger>
      </ActionTooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <RiSunLine />
          {t("theme.light")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <RiMoonLine />
          {t("theme.dark")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <RiComputerLine />
          {t("theme.system")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
