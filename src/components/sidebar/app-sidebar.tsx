"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiDashboardLine } from "@remixicon/react";

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
                    Server manager
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/"}
                  tooltip="Servers"
                >
                  <Link href="/">
                    <RiDashboardLine />
                    <span>Servers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarServerList servers={servers} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserMenu user={user} />
      </SidebarFooter>

    </Sidebar>
  );
}
