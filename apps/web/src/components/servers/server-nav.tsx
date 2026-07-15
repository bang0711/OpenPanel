"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiAlarmWarningLine,
  RiAppsLine,
  RiArchive2Line,
  RiArrowLeftRightLine,
  RiBox3Line,
  RiCodeSSlashLine,
  RiDashboardLine,
  RiDatabase2Line,
  RiDownloadCloud2Line,
  RiFileList3Line,
  RiFolderLine,
  RiGlobalLine,
  RiGroupLine,
  RiKey2Line,
  RiLockPasswordLine,
  RiPulseLine,
  RiRadarLine,
  RiRouteLine,
  RiShieldFlashLine,
  RiShieldKeyholeLine,
  RiShieldUserLine,
  RiShip2Line,
  RiShutDownLine,
  RiTerminalBoxLine,
  RiTimeLine,
} from "@remixicon/react";

import { cn } from "@/lib/utils";

import { useT } from "@/components/common/i18n-provider";

// One horizontally-scrollable row. Ordered by area (system → ops → security →
// web → databases); segments match the page folder under servers/[id]/.
const tabs = [
  { seg: "", key: "nav.dashboard", icon: RiDashboardLine },
  { seg: "services", key: "nav.services", icon: RiPulseLine },
  { seg: "packages", key: "nav.packages", icon: RiBox3Line },
  { seg: "catalog", key: "nav.catalog", icon: RiAppsLine },
  { seg: "docker", key: "nav.docker", icon: RiShip2Line },
  { seg: "cron", key: "nav.cron", icon: RiTimeLine },
  { seg: "backups", key: "nav.backups", icon: RiArchive2Line },
  { seg: "files", key: "nav.files", icon: RiFolderLine },
  { seg: "logs", key: "nav.logs", icon: RiFileList3Line },
  { seg: "terminal", key: "nav.terminal", icon: RiTerminalBoxLine },
  { seg: "alerts", key: "nav.alerts", icon: RiAlarmWarningLine },
  { seg: "firewall", key: "nav.firewall", icon: RiShieldFlashLine },
  { seg: "fail2ban", key: "nav.fail2ban", icon: RiShieldKeyholeLine },
  { seg: "ports", key: "nav.ports", icon: RiRadarLine },
  { seg: "ssl", key: "nav.ssl", icon: RiLockPasswordLine },
  { seg: "ssh-keys", key: "nav.sshKeys", icon: RiKey2Line },
  { seg: "users", key: "nav.users", icon: RiGroupLine },
  { seg: "access", key: "nav.access", icon: RiShieldUserLine },
  { seg: "vhost", key: "nav.vhost", icon: RiGlobalLine },
  { seg: "proxy", key: "nav.proxy", icon: RiArrowLeftRightLine },
  { seg: "dns", key: "nav.dns", icon: RiRouteLine },
  { seg: "db", key: "nav.db", icon: RiDatabase2Line },
  { seg: "query", key: "nav.query", icon: RiCodeSSlashLine },
  { seg: "db-backup", key: "nav.dbBackup", icon: RiDownloadCloud2Line },
  { seg: "power", key: "nav.power", icon: RiShutDownLine },
];

export function ServerNav({ serverId }: { serverId: string }) {
  const pathname = usePathname();
  const t = useT();
  const base = `/servers/${serverId}`;

  return (
    <nav className="flex gap-1 overflow-x-auto border-b px-4">
      {tabs.map(({ seg, key, icon: Icon }) => {
        const href = seg ? `${base}/${seg}` : base;
        const active = seg ? pathname.startsWith(href) : pathname === base;
        return (
          <Link
            key={key}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-2 py-2 text-xs font-medium transition-colors",
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
