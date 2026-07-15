"use client";

import { LOCALE_NAMES, LOCALES } from "@/lib/i18n/messages";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ActionTooltip } from "@/components/common/action-tooltip";
import { FlagIcon } from "@/components/common/flag-icon";
import { useI18n } from "@/components/common/i18n-provider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <ActionTooltip label={t("common.language")}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="flex justify-center">
            <FlagIcon locale={locale} className="m-auto" />
            <span className="sr-only">{t("common.language")}</span>
          </Button>
        </DropdownMenuTrigger>
      </ActionTooltip>

      <DropdownMenuContent align="end">
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className={l === locale ? "font-medium" : undefined}
          >
            <FlagIcon locale={l} />
            {LOCALE_NAMES[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
