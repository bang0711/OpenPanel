"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type OpenPort } from "@/lib/api";

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

export function PortsManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [ports, setPorts] = useState<OpenPort[] | null>(null);

  const load = useCallback(async () => {
    try {
      setPorts(await api.ports.list(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("ports.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{t("ports.title")}</span>
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t("ports.colProto")}</TableHead>
              <TableHead>{t("ports.colAddress")}</TableHead>
              <TableHead className="w-20">{t("ports.colPort")}</TableHead>
              <TableHead>{t("ports.colProcess")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ports?.map((p, i) => (
              <TableRow key={`${p.proto}-${p.localAddress}-${p.port}-${i}`}>
                <TableCell className="font-mono text-xs">{p.proto}</TableCell>
                <TableCell className="font-mono text-xs">
                  {p.localAddress}
                </TableCell>
                <TableCell className="font-mono text-xs">{p.port}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.process}
                </TableCell>
              </TableRow>
            ))}
            {ports && ports.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("ports.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
