"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type KillSignalName,type ProcessInfo } from "@/lib/api";

import { RefreshButton } from "@/components/common/refresh-button";

import { ProcessesTable } from "./processes-table";

export function ProcessesTab({ serverId }: { serverId: string }) {
  const [procs, setProcs] = useState<ProcessInfo[] | null>(null);

  const load = useCallback(async () => {
    try {
      setProcs(await api.services.processes(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load");
    }
  }, [serverId]);

  useEffect(() => {
    load();
  }, [load]);

  const onKill = useCallback(
    async (pid: number, signal: KillSignalName) => {
      try {
        const result = await api.services.kill(serverId, pid, signal);
        if (result.ok) toast.success(`Sent SIG${signal} to ${pid}`);
        else toast.error(result.output || "kill failed");
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "kill failed");
      } finally {
        load();
      }
    },
    [serverId, load],
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
