"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiAppsLine,
  RiBox3Line,
  RiDashboardLine,
  RiFolderLine,
  RiPulseLine,
  RiShieldFlashLine,
  RiTerminalBoxLine,
  RiTimeLine,
} from "@remixicon/react";

import { cn } from "@/lib/utils";

import { useT } from "@/components/common/i18n-provider";

const tabs = [
  { seg: "", key: "nav.dashboard", icon: RiDashboardLine },
  { seg: "services", key: "nav.services", icon: RiPulseLine },
  { seg: "packages", key: "nav.packages", icon: RiBox3Line },
  { seg: "catalog", key: "nav.catalog", icon: RiAppsLine },
  { seg: "cron", key: "nav.cron", icon: RiTimeLine },
  { seg: "firewall", key: "nav.firewall", icon: RiShieldFlashLine },
  { seg: "files", key: "nav.files", icon: RiFolderLine },
  { seg: "terminal", key: "nav.terminal", icon: RiTerminalBoxLine },
];

export function ServerNav({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const t = useT();
  const base = `/servers/${serverId}`;

  return (
    <nav className="flex gap-1 border-b px-4">
      {tabs.map(({ seg, key, icon: Icon }) => {
        const href = seg ? `${base}/${seg}` : base;
        const active = seg ? pathname.startsWith(href) : pathname === base;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-2 py-2 text-xs font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
