"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useT } from "@/components/common/i18n-provider";

import { ProcessesTab } from "./processes-tab";
import { ServicesTab } from "./services-tab";

export function ServicesPanel({ serverId }: { serverId: string }) {
  const t = useT();
  return (
    <Tabs defaultValue="services">
      <TabsList>
        <TabsTrigger value="services">{t("services.tab.services")}</TabsTrigger>
        <TabsTrigger value="processes">
          {t("services.tab.processes")}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="services">
        <ServicesTab serverId={serverId} />
      </TabsContent>
      <TabsContent value="processes">
        <ProcessesTab serverId={serverId} />
      </TabsContent>
    </Tabs>
  );
}
