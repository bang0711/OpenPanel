"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { InstalledPackages } from "./installed-packages";
import { PackageSearch } from "./package-search";

export function PackagesPanel({ serverId }: { serverId: string }) {
  return (
    <Tabs defaultValue="installed">
      <TabsList>
        <TabsTrigger value="installed">Installed</TabsTrigger>
        <TabsTrigger value="search">Search &amp; install</TabsTrigger>
      </TabsList>
      <TabsContent value="installed">
        <InstalledPackages serverId={serverId} />
      </TabsContent>
      <TabsContent value="search">
        <PackageSearch serverId={serverId} />
      </TabsContent>
    </Tabs>
  );
}
