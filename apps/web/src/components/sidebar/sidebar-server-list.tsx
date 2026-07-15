"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiServerLine } from "@remixicon/react";

import { Input } from "@/components/ui/input";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { useT } from "@/components/common/i18n-provider";

export type SidebarServer = {
  id: string;
  name: string;
  host: string;
  tags?: string[];
};

export function SidebarServerList({ servers }: { servers: SidebarServer[] }) {
  const pathname = usePathname();
  const t = useT();
  const [q, setQ] = useState("");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return servers;
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) ||
        s.host.toLowerCase().includes(needle) ||
        (s.tags ?? []).some((tag) => tag.toLowerCase().includes(needle)),
    );
  }, [servers, q]);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("nav.hosts")}</SidebarGroupLabel>
      <SidebarGroupContent>
        {servers.length > 0 && (
          <div className="px-1 pb-1 group-data-[collapsible=icon]:hidden">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("common.searchServers")}
              className="h-7 text-xs"
            />
          </div>
        )}
        <SidebarMenu>
          {shown.map((s) => (
            <SidebarMenuItem key={s.id}>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(`/servers/${s.id}`)}
                tooltip={s.name}
              >
                <Link href={`/servers/${s.id}`}>
                  <RiServerLine />
                  <span className="flex-1 truncate">{s.name}</span>
                  {(s.tags ?? []).length > 0 && (
                    <span className="truncate text-[0.625rem] text-muted-foreground group-data-[collapsible=icon]:hidden">
                      {(s.tags ?? [])[0]}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          {servers.length > 0 && shown.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {t("common.noMatch")}
            </p>
          )}
          {servers.length === 0 && (
            <p className="px-2 py-1 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
              {t("common.noServers")}
            </p>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
