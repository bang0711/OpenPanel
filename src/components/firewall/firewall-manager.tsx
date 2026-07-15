"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type FwStatus } from "@/lib/api";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { AddRuleDialog } from "./add-rule-dialog";

export function FirewallManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [status, setStatus] = useState<FwStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await api.firewall.status(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("firewall.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle() {
    if (!status) return;
    setBusy(true);
    try {
      const r = status.active
        ? await api.firewall.disable(serverId)
        : await api.firewall.enable(serverId);
      if (r.ok) toast.success(status.active ? t("firewall.disabled") : t("firewall.enabled"));
      else toast.error(r.output || t("firewall.failed"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("firewall.failed"));
    } finally {
      setBusy(false);
      load();
    }
  }

  async function remove(num: number) {
    if (!confirm(t("firewall.confirmDelete").replace("{num}", String(num)))) return;
    try {
      await api.firewall.deleteRule(serverId, num);
      toast.success(t("firewall.ruleDeleted"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("firewall.deleteFailed"));
    } finally {
      load();
    }
  }

  if (status && !status.installed) {
    return (
      <Alert>
        <AlertTitle>{t("firewall.notInstalled")}</AlertTitle>
        <AlertDescription>
          {t("firewall.notInstalledHint")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("firewall.status")}</span>
          <Badge variant={status?.active ? "secondary" : "outline"}>
            {status?.active ? t("firewall.active") : t("firewall.inactive")}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={status?.active ? "destructive" : "default"}
            onClick={toggle}
            disabled={busy || !status}
          >
            {status?.active ? t("firewall.disable") : t("firewall.enable")}
          </Button>
          <AddRuleDialog serverId={serverId} onAdded={load} />
          <RefreshButton onClick={load} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">{t("firewall.colNum")}</TableHead>
              <TableHead>{t("firewall.colTo")}</TableHead>
              <TableHead>{t("firewall.colAction")}</TableHead>
              <TableHead>{t("firewall.colFrom")}</TableHead>
              <TableHead className="text-right">{t("common.delete")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status?.rules.map((r) => (
              <TableRow key={r.num}>
                <TableCell className="font-mono text-xs">{r.num}</TableCell>
                <TableCell className="font-mono text-xs">{r.to}</TableCell>
                <TableCell>
                  <Badge
                    variant={r.action === "ALLOW" ? "secondary" : "outline"}
                  >
                    {r.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {r.from}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton label={t("common.delete")} onClick={() => remove(r.num)}>
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {status && status.rules.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("firewall.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
