import { redirect } from "next/navigation";

import type { Server } from "@/lib/api";
import { serverFetch } from "@/lib/server-fetch";
import { getSession } from "@/lib/session";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { LanguageToggle } from "@/components/common/language-toggle";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const servers = (await serverFetch<Server[]>("/api/servers")) ?? [];

  return (
    <TooltipProvider>
      {/* h-svh (not min-h-svh): the shell is pinned to the viewport so each
          region scrolls itself instead of growing the page. */}
      <SidebarProvider className="h-svh">
        <AppSidebar
          servers={servers}
          user={{
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
          }}
        />
        <SidebarInset className="min-h-0 overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-full" />
            <span className="text-sm font-medium">OpenPanel</span>
            <div className="ml-auto flex items-center gap-1">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
