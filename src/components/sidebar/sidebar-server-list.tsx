"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiServerLine } from "@remixicon/react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export type SidebarServer = { id: string; name: string; host: string };

export function SidebarServerList({ servers }: { servers: SidebarServer[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Hosts</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {servers.map((s) => (
            <SidebarMenuItem key={s.id}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(`/servers/${s.id}`)}
                tooltip={s.name}
              >
                <Link href={`/servers/${s.id}`}>
                  <RiServerLine />
                  <span>{s.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {servers.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              No servers yet
            </p>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
