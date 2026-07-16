"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { ScrollArea } from "@/components/ui/scroll-area";

import { useT } from "@/components/common/i18n-provider";

import {
  isNavItemActive,
  NAV_GROUPS,
  navHref,
} from "./server-nav.constant";

/** Grouped vertical rail (desktop). Mobile uses ServerNavSelect instead. */
export function ServerNav({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const t = useT();
  const base = `/servers/${serverId}`;

  return (
    <nav className="hidden w-52 shrink-0 border-r lg:block">
      <ScrollArea className="h-full">
        <div className="space-y-4 p-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.key} className="space-y-1">
            <p className="px-2 text-[0.625rem] font-medium tracking-widest text-muted-foreground uppercase">
              {t(group.key)}
            </p>
            {group.items.map(({ seg, key, icon: Icon }) => {
              const active = isNavItemActive(pathname, base, seg);
              return (
                <Link
                  key={key}
                  href={navHref(base, seg)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="truncate">{t(key)}</span>
                </Link>
              );
            })}
          </div>
        ))}
        </div>
      </ScrollArea>
    </nav>
  );
}
