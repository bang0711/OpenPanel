"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  api,
  ApiError,
  type ServiceActionName,
  type ServiceUnit,
} from "@/lib/api";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useT } from "@/components/common/i18n-provider";
import { RefreshButton } from "@/components/common/refresh-button";

import { ServiceLogsDialog } from "./service-logs-dialog";
import { ServicesPagination } from "./services-pagination";
import { ServicesTable } from "./services-table";

// A systemd host lists 150-300 units; page them so the tab stays a fixed height.
const PAGE_SIZE = 25;

const STATES = [
  { value: "all", key: "services.state.all" },
  { value: "active", key: "services.state.active" },
  { value: "inactive", key: "services.state.inactive" },
  { value: "failed", key: "services.state.failed" },
] as const;

export function ServicesTab({ serverId }: { serverId: string }) {
  const t = useT();
  const [units, setUnits] = useState<ServiceUnit[] | null>(null);
  const [filter, setFilter] = useState("");
  const [state, setState] = useState<string>("all");
  const [page, setPage] = useState(1);
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
        (state === "all" || u.active === state) &&
        (u.unit.toLowerCase().includes(q) ||
          u.description.toLowerCase().includes(q)),
    );
  }, [units, filter, state]);

  useEffect(() => {
    setPage(1);
  }, [filter, state]);

  // Filtering can shrink the list under the current page — clamp rather than
  // render an empty page.
  const pageCount = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const paged = useMemo(
    () => shown.slice(start, start + PAGE_SIZE),
    [shown, start],
  );

  const onAction = useCallback(
    async (unit: string, action: ServiceActionName) => {
      setBusyKey(unit + action);
      try {
        const result = await api.services.action(serverId, unit, action);
        if (result.ok)
          toast.success(`${unit}: ${action} ${t("services.actionOk")}`);
        else
          toast.error(
            result.output || `${action} ${t("services.actionFailed")}`,
          );
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
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder={t("services.filterPlaceholder")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={state} onValueChange={setState}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {t(s.key)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {t("services.count")
            .replace("{shown}", String(shown.length))
            .replace("{total}", String(units?.length ?? 0))}
        </span>
        <div className="ml-auto">
          <RefreshButton onClick={load} />
        </div>
      </div>

      <ServicesTable
        units={paged}
        busyKey={busyKey}
        onAction={onAction}
        onLogs={setLogsFor}
      />

      <ServicesPagination
        page={current}
        pageCount={pageCount}
        from={shown.length === 0 ? 0 : start + 1}
        to={Math.min(start + PAGE_SIZE, shown.length)}
        total={shown.length}
        onPage={setPage}
      />

      <ServiceLogsDialog
        serverId={serverId}
        unit={logsFor}
        onClose={() => setLogsFor(null)}
      />
    </div>
  );
}
