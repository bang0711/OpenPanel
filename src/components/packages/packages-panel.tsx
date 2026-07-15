"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useT } from "@/components/common/i18n-provider";

import { InstalledPackages } from "./installed-packages";
import { PackageSearch } from "./package-search";

export function PackagesPanel({ serverId }: { serverId: string }) {
  const t = useT();
  return (
    <Tabs defaultValue="installed">
      <TabsList>
        <TabsTrigger value="installed">{t("packages.tab.installed")}</TabsTrigger>
        <TabsTrigger value="search">{t("packages.tab.search")}</TabsTrigger>
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
