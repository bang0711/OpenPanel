"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ProcessesTab } from "./processes-tab";
import { ServicesTab } from "./services-tab";

export function ServicesPanel({ serverId }: { serverId: string }) {
  return (
    <Tabs defaultValue="services">
      <TabsList>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="processes">Processes</TabsTrigger>
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
