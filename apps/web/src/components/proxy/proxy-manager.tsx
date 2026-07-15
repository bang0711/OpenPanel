"use client";

import { useCallback, useEffect, useState } from "react";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type ProxyStatus } from "@/lib/api";

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

import { CommandOutputDialog } from "@/components/common/command-output-dialog";
import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";
import { RefreshButton } from "@/components/common/refresh-button";

import { AddProxyDialog } from "./add-proxy-dialog";

export function ProxyManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [status, setStatus] = useState<ProxyStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await api.proxy.status(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("proxy.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = useCallback(
    async (name: string) => {
      if (!confirm(t("proxy.confirmDelete"))) return;
      setBusy(name);
      try {
        const r = await api.proxy.remove(serverId, name);
        if (r.ok) toast.success(t("proxy.removed"));
        else toast.error(r.output || t("proxy.removeFailed"));
        if (r.output) setOutput(r.output);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : t("proxy.removeFailed"));
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
        <AlertTitle>{t("proxy.notInstalled")}</AlertTitle>
        <AlertDescription>{t("proxy.notInstalledHint")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end gap-2">
        <Button size="sm" onClick={() => setAdding(true)}>
          <RiAddLine />
          {t("proxy.add")}
        </Button>
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("proxy.colName")}</TableHead>
              <TableHead>{t("proxy.colServerName")}</TableHead>
              <TableHead>{t("proxy.colUpstream")}</TableHead>
              <TableHead>{t("vhost.enabled")}</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {status?.proxies.map((p) => (
              <TableRow key={p.name}>
                <TableCell className="font-mono text-xs">{p.name}</TableCell>
                <TableCell className="font-mono text-xs">{p.serverName}</TableCell>
                <TableCell className="font-mono text-xs">{p.upstream}</TableCell>
                <TableCell>
                  <Badge variant={p.enabled ? "secondary" : "outline"}>
                    {p.enabled ? t("vhost.enabled") : t("vhost.disabled")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end">
                    <IconButton
                      label={t("common.delete")}
                      disabled={busy === p.name}
                      onClick={() => remove(p.name)}
                    >
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {status && status.proxies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("proxy.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AddProxyDialog
        serverId={serverId}
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(o) => {
          if (o) setOutput(o);
          load();
        }}
      />

      <CommandOutputDialog
        title={output !== null ? "nginx -t" : null}
        output={output ?? ""}
        onClose={() => setOutput(null)}
      />
    </div>
  );
}
