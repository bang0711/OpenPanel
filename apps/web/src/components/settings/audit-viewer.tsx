"use client";

import { useCallback, useEffect, useState } from "react";
import { RiShieldKeyholeLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type AuditEntry } from "@/lib/api";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useT } from "@/components/common/i18n-provider";
import { RefreshButton } from "@/components/common/refresh-button";

export function AuditViewer() {
  const t = useT();
  const [entries, setEntries] = useState<AuditEntry[] | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    try {
      setEntries(await api.audit.list());
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : t("audit.loadFailed"),
      );
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  if (forbidden) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Alert variant="destructive">
          <RiShieldKeyholeLine />
          <AlertTitle>{t("audit.adminsOnly")}</AlertTitle>
          <AlertDescription>{t("audit.adminsOnlyDescription")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("audit.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("audit.subtitle")}</p>
        </div>
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">{t("audit.colTime")}</TableHead>
              <TableHead>{t("audit.colUser")}</TableHead>
              <TableHead>{t("audit.colAction")}</TableHead>
              <TableHead>{t("audit.colServer")}</TableHead>
              <TableHead>{t("audit.colDetail")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries?.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-xs">{e.userEmail}</TableCell>
                <TableCell className="font-mono text-xs">{e.action}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {e.serverId ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground break-all">
                  {e.detail ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {entries && entries.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("audit.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
