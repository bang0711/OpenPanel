"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiFileList3Line,
  RiKey2Line,
  RiNotification3Line,
  RiStackLine,
} from "@remixicon/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useT } from "@/components/common/i18n-provider";
import { Logo } from "@/components/common/logo";

import {
  type SidebarServer,
  SidebarServerList,
} from "./sidebar-server-list";
import { type SidebarUser,SidebarUserMenu } from "./sidebar-user-menu";

export function AppSidebar({
  servers,
  user,
}: {
  servers: SidebarServer[];
  user: SidebarUser;
}) {
  const pathname = usePathname();
  const t = useT();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="OpenPanel">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Logo className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    OpenPanel
                  </span>
                  <span className="truncate text-[0.625rem] text-muted-foreground">
                    {t("app.tagline")}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.overview")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip={t("nav.servers")}
                >
                  <Link href="/">
                    <RiDashboardLine />
                    <span>{t("nav.servers")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarServerList servers={servers} />

        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.tools")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                { href: "/bulk", key: "nav.bulk", icon: RiStackLine },
                { href: "/settings/tokens", key: "nav.tokens", icon: RiKey2Line },
                {
                  href: "/settings/notifications",
                  key: "nav.notifications",
                  icon: RiNotification3Line,
                },
                { href: "/audit", key: "nav.audit", icon: RiFileList3Line },
              ].map(({ href, key, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(href)}
                    tooltip={t(key)}
                  >
                    <Link href={href}>
                      <Icon />
                      <span>{t(key)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu user={user} />
      </SidebarFooter>

    </Sidebar>
  );
}
