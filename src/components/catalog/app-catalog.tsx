"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";
import { CATALOG_APPS, type CatalogApp } from "@/lib/catalog";

import { CommandOutputDialog } from "@/components/common/command-output-dialog";

import { CatalogAppCard } from "./catalog-app-card";

export function AppCatalog({ serverId }: { serverId: string }) {
  // App metadata is bundled at build time — the grid renders instantly.
  const [installed, setInstalled] = useState<Record<string, boolean>>({});
  const [installing, setInstalling] = useState<string | null>(null);
  const [output, setOutput] = useState<{ title: string; body: string } | null>(
    null,
  );

  const loadStatus = useCallback(async () => {
    try {
      const r = await api.catalog.status(serverId);
      setInstalled(r.installed);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load status");
    }
  }, [serverId]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const install = useCallback(
    async (app: CatalogApp) => {
      setInstalling(app.id);
      try {
        const r = await api.catalog.install(serverId, app.id);
        setOutput({ title: `install ${app.name}`, body: r.output });
        if (r.ok) toast.success(`${app.name} installed`);
        else toast.error("Install failed — see output");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Install failed");
      } finally {
        setInstalling(null);
        loadStatus();
      }
    },
    [serverId, loadStatus],
  );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG_APPS.map((app) => (
          <CatalogAppCard
            key={app.id}
            app={app}
            installed={!!installed[app.id]}
            installing={installing === app.id}
            onInstall={() => install(app)}
          />
        ))}
      </div>

      <CommandOutputDialog
        title={output?.title ?? null}
        output={output?.body ?? ""}
        onClose={() => setOutput(null)}
      />
    </>
  );
}
