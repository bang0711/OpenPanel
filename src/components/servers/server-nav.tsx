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

const tabs = [
  { seg: "", label: "Dashboard", icon: RiDashboardLine },
  { seg: "services", label: "Services", icon: RiPulseLine },
  { seg: "packages", label: "Packages", icon: RiBox3Line },
  { seg: "catalog", label: "Catalog", icon: RiAppsLine },
  { seg: "cron", label: "Cron", icon: RiTimeLine },
  { seg: "firewall", label: "Firewall", icon: RiShieldFlashLine },
  { seg: "files", label: "Files", icon: RiFolderLine },
  { seg: "terminal", label: "Terminal", icon: RiTerminalBoxLine },
];

export function ServerNav({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const base = `/servers/${serverId}`;

  return (
    <nav className="flex gap-1 border-b px-4">
      {tabs.map(({ seg, label, icon: Icon }) => {
        const href = seg ? `${base}/${seg}` : base;
        const active = seg ? pathname.startsWith(href) : pathname === base;
        return (
          <Link
            key={label}
            href={href}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-2 py-2 text-xs font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
