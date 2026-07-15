"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type SslStatus } from "@/lib/api";

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
import { RefreshButton } from "@/components/common/refresh-button";

import { IssueCertDialog } from "./issue-cert-dialog";

export function SslManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [status, setStatus] = useState<SslStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<{ title: string; body: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      setStatus(await api.ssl.status(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("ssl.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onIssued = useCallback(
    (body: string) => {
      setOutput({ title: t("ssl.issue"), body });
      load();
    },
    [t, load],
  );

  async function renew() {
    setBusy(true);
    try {
      const r = await api.ssl.renew(serverId);
      if (r.ok) toast.success(t("ssl.renewed"));
      else toast.error(r.output || t("ssl.renewFailed"));
      setOutput({ title: t("ssl.renew"), body: r.output });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("ssl.renewFailed"));
    } finally {
      setBusy(false);
      load();
    }
  }

  if (status && !status.installed) {
    return (
      <Alert>
        <AlertTitle>{t("ssl.notInstalled")}</AlertTitle>
        <AlertDescription>{t("ssl.notInstalledHint")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <IssueCertDialog serverId={serverId} onIssued={onIssued} />
        <Button
          size="sm"
          variant="outline"
          onClick={renew}
          disabled={busy || !status}
        >
          {t("ssl.renewAll")}
        </Button>
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("ssl.colName")}</TableHead>
              <TableHead>{t("ssl.colDomains")}</TableHead>
              <TableHead>{t("ssl.colExpiry")}</TableHead>
              <TableHead className="text-right">{t("ssl.valid")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status?.certs.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-mono text-xs">{c.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {c.domains.join(", ")}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {c.expiry}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Badge variant={c.valid ? "secondary" : "outline"}>
                      {c.valid ? t("ssl.valid") : t("ssl.expired")}
                    </Badge>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {status && status.certs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("ssl.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CommandOutputDialog
        title={output?.title ?? null}
        output={output?.body ?? ""}
        onClose={() => setOutput(null)}
      />
    </div>
  );
}
