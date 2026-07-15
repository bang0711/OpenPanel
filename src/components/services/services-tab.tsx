"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type ServiceActionName,type ServiceUnit } from "@/lib/api";

import { Input } from "@/components/ui/input";

import { useT } from "@/components/common/i18n-provider";
import { RefreshButton } from "@/components/common/refresh-button";

import { ServiceLogsDialog } from "./service-logs-dialog";
import { ServicesTable } from "./services-table";

export function ServicesTab({ serverId }: { serverId: string }) {
  const t = useT();
  const [units, setUnits] = useState<ServiceUnit[] | null>(null);
  const [filter, setFilter] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [logsFor, setLogsFor] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setUnits(await api.services.list(serverId));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("services.loadFailed"),
      );
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    if (!units) return [];
    const q = filter.toLowerCase();
    return units.filter(
      (u) =>
        u.unit.toLowerCase().includes(q) ||
        u.description.toLowerCase().includes(q),
    );
  }, [units, filter]);

  const onAction = useCallback(
    async (unit: string, action: ServiceActionName) => {
      setBusyKey(unit + action);
      try {
        const result = await api.services.action(serverId, unit, action);
        if (result.ok)
          toast.success(`${unit}: ${action} ${t("services.actionOk")}`);
        else
          toast.error(result.output || `${action} ${t("services.actionFailed")}`);
      } catch (err) {
        toast.error(
          err instanceof ApiError
            ? err.message
            : `${action} ${t("services.actionFailed")}`,
        );
      } finally {
        setBusyKey(null);
        load();
      }
    },
    [serverId, load, t],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t("services.filterPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <RefreshButton onClick={load} />
      </div>

      <ServicesTable
        units={shown}
        busyKey={busyKey}
        onAction={onAction}
        onLogs={setLogsFor}
      />

      <ServiceLogsDialog
        serverId={serverId}
        unit={logsFor}
        onClose={() => setLogsFor(null)}
      />
    </div>
  );
}
