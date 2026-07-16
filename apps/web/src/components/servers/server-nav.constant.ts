import {
  type RemixiconComponentType,
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

export type NavItem = {
  seg: string;
  key: string;
  icon: RemixiconComponentType;
};

export type NavGroup = {
  key: string;
  items: NavItem[];
};

export function navHref(base: string, seg: string) {
  return seg ? `${base}/${seg}` : base;
}

/**
 * Exact-or-child match. A bare `startsWith` would light up `db` on the
 * `db-backup` route, so the boundary slash matters.
 */
export function isNavItemActive(pathname: string, base: string, seg: string) {
  if (!seg) return pathname === base;
  const href = `${base}/${seg}`;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Server-detail nav, grouped by area. `seg` matches the folder under servers/[id]/. */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: "nav.group.system",
    items: [
      { seg: "", key: "nav.dashboard", icon: RiDashboardLine },
      { seg: "services", key: "nav.services", icon: RiPulseLine },
      { seg: "packages", key: "nav.packages", icon: RiBox3Line },
      { seg: "catalog", key: "nav.catalog", icon: RiAppsLine },
      { seg: "files", key: "nav.files", icon: RiFolderLine },
      { seg: "terminal", key: "nav.terminal", icon: RiTerminalBoxLine },
    ],
  },
  {
    key: "nav.group.ops",
    items: [
      { seg: "docker", key: "nav.docker", icon: RiShip2Line },
      { seg: "cron", key: "nav.cron", icon: RiTimeLine },
      { seg: "backups", key: "nav.backups", icon: RiArchive2Line },
      { seg: "logs", key: "nav.logs", icon: RiFileList3Line },
      { seg: "alerts", key: "nav.alerts", icon: RiAlarmWarningLine },
      { seg: "power", key: "nav.power", icon: RiShutDownLine },
    ],
  },
  {
    key: "nav.group.security",
    items: [
      { seg: "firewall", key: "nav.firewall", icon: RiShieldFlashLine },
      { seg: "fail2ban", key: "nav.fail2ban", icon: RiShieldKeyholeLine },
      { seg: "ports", key: "nav.ports", icon: RiRadarLine },
      { seg: "ssl", key: "nav.ssl", icon: RiLockPasswordLine },
      { seg: "ssh-keys", key: "nav.sshKeys", icon: RiKey2Line },
      { seg: "users", key: "nav.users", icon: RiGroupLine },
      { seg: "access", key: "nav.access", icon: RiShieldUserLine },
    ],
  },
  {
    key: "nav.group.web",
    items: [
      { seg: "vhost", key: "nav.vhost", icon: RiGlobalLine },
      { seg: "proxy", key: "nav.proxy", icon: RiArrowLeftRightLine },
      { seg: "dns", key: "nav.dns", icon: RiRouteLine },
    ],
  },
  {
    key: "nav.group.databases",
    items: [
      { seg: "db", key: "nav.db", icon: RiDatabase2Line },
      { seg: "query", key: "nav.query", icon: RiCodeSSlashLine },
      { seg: "db-backup", key: "nav.dbBackup", icon: RiDownloadCloud2Line },
    ],
  },
];
