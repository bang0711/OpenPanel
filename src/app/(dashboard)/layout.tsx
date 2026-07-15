import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { prisma } from "@/db/prisma";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { ThemeToggle } from "@/components/common/theme-toggle";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const servers = await prisma.server.findMany({
    where: session.user.role === "admin" ? {} : { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, host: true },
  });

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          servers={servers}
          user={{
            email: session.user.email,
            name: session.user.name,
            role: session.user.role,
          }}
        />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-1 h-full" />
            <span className="text-sm font-medium">OpenPanel</span>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
