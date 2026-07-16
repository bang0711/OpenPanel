"use client";

import { useCallback, useEffect, useState } from "react";
import { RiEditLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type VhostStatus } from "@/lib/api";

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

import { EditSiteDialog } from "./edit-site-dialog";

export function VhostManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [status, setStatus] = useState<VhostStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await api.vhost.status(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("vhost.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = useCallback(
    async (name: string, enabled: boolean) => {
      setBusy(name);
      try {
        const r = enabled
          ? await api.vhost.disable(serverId, name)
          : await api.vhost.enable(serverId, name);
        if (r.ok) toast.success(t("vhost.toggled"));
        else toast.error(r.output || t("vhost.toggleFailed"));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : t("vhost.toggleFailed"));
      } finally {
        setBusy(null);
        load();
      }
    },
    [serverId, t, load],
  );

  if (status && !status.installed) {
    return (
      <Alert>
        <AlertTitle>{t("vhost.notInstalled")}</AlertTitle>
        <AlertDescription>{t("vhost.notInstalledHint")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("vhost.colName")}</TableHead>
              <TableHead>{t("vhost.enabled")}</TableHead>
              <TableHead className="text-right">{t("vhost.edit")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status?.sites.map((s) => (
              <TableRow key={s.name}>
                <TableCell className="font-mono text-xs">{s.name}</TableCell>
                <TableCell>
                  <Badge variant={s.enabled ? "secondary" : "outline"}>
                    {s.enabled ? t("vhost.enabled") : t("vhost.disabled")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant={s.enabled ? "destructive" : "default"}
                      disabled={busy === s.name}
                      onClick={() => toggle(s.name, s.enabled)}
                    >
                      {s.enabled ? t("vhost.disable") : t("vhost.enable")}
                    </Button>
                    <IconButton
                      label={t("vhost.edit")}
                      onClick={() => setEditing(s.name)}
                    >
                      <RiEditLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {status && status.sites.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("vhost.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <EditSiteDialog
        serverId={serverId}
        site={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
