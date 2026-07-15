"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type KillSignalName,type ProcessInfo } from "@/lib/api";

import { useT } from "@/components/common/i18n-provider";
import { RefreshButton } from "@/components/common/refresh-button";

import { ProcessesTable } from "./processes-table";

export function ProcessesTab({ serverId }: { serverId: string }) {
  const t = useT();
  const [procs, setProcs] = useState<ProcessInfo[] | null>(null);

  const load = useCallback(async () => {
    try {
      setProcs(await api.services.processes(serverId));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("services.loadFailed"),
      );
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onKill = useCallback(
    async (pid: number, signal: KillSignalName) => {
      try {
        const result = await api.services.kill(serverId, pid, signal);
        if (result.ok)
          toast.success(`${t("services.proc.killSent")} SIG${signal} → ${pid}`);
        else toast.error(result.output || t("services.proc.killFailed"));
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : t("services.proc.killFailed"),
        );
      } finally {
        load();
      }
    },
    [serverId, load, t],
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RefreshButton onClick={load} />
      </div>
      <ProcessesTable procs={procs ?? []} onKill={onKill} />
    </div>
  );
}
