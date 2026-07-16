"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { type AlertsData,api, ApiError } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";
import { RefreshButton } from "@/components/common/refresh-button";

import { AddAlertDialog } from "./add-alert-dialog";

export function AlertsManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [data, setData] = useState<AlertsData | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.alerts.list(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("alerts.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (ruleId: string, enabled: boolean) => {
      try {
        await api.alerts.setEnabled(serverId, ruleId, enabled);
        toast.success(t("alerts.toggled"));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : t("alerts.loadFailed"));
      } finally {
        load();
      }
    },
    [serverId, t, load],
  );

  const remove = useCallback(
    async (ruleId: string) => {
      if (!confirm(t("alerts.confirmDelete"))) return;
      try {
        await api.alerts.remove(serverId, ruleId);
        toast.success(t("alerts.removed"));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : t("alerts.removeFailed"));
      } finally {
        load();
      }
    },
    [serverId, t, load],
  );

  const channelName = useCallback(
    (id: string | null) =>
      (id && data?.channels.find((c) => c.id === id)?.name) ||
      t("alerts.noChannel"),
    [data, t],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <AddAlertDialog
          serverId={serverId}
          channels={data?.channels ?? []}
          onAdded={load}
        />
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("alerts.colMetric")}</TableHead>
              <TableHead>{t("alerts.colCondition")}</TableHead>
              <TableHead>{t("alerts.colTarget")}</TableHead>
              <TableHead>{t("alerts.colChannel")}</TableHead>
              <TableHead>{t("alerts.enabled")}</TableHead>
              <TableHead>{t("alerts.firing")}</TableHead>
              <TableHead className="text-right">{t("common.delete")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{t(`alerts.${r.metric}`)}</TableCell>
                <TableCell className="font-mono text-xs">
                  {r.op} {r.threshold}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {r.target || "—"}
                </TableCell>
                <TableCell className="text-xs">{channelName(r.channelId)}</TableCell>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={(e) => toggle(r.id, e.currentTarget.checked)}
                    aria-label={t("alerts.enabled")}
                  />
                </TableCell>
                <TableCell>
                  <Badge variant={r.firing ? "destructive" : "outline"}>
                    {r.firing ? t("alerts.firing") : t("alerts.ok")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton
                      label={t("common.delete")}
                      onClick={() => remove(r.id)}
                    >
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data && data.rules.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("alerts.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
