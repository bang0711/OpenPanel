"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type CronJob } from "@/lib/api";

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

import { AddCronDialog } from "./add-cron-dialog";

export function CronManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [jobs, setJobs] = useState<CronJob[] | null>(null);

  const load = useCallback(async () => {
    try {
      setJobs(await api.cron.list(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("cron.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(index: number) {
    if (!confirm(t("cron.confirmDelete"))) return;
    try {
      await api.cron.remove(serverId, index);
      toast.success(t("cron.removed"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("cron.deleteFailed"));
    } finally {
      load();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {t("cron.description")}
        </p>
        <div className="flex gap-2">
          <AddCronDialog serverId={serverId} onAdded={load} />
          <RefreshButton onClick={load} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">{t("cron.schedule")}</TableHead>
              <TableHead>{t("cron.command")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs?.map((j) => (
              <TableRow key={j.index}>
                <TableCell className="font-mono text-xs">
                  {j.schedule}
                </TableCell>
                <TableCell className="font-mono text-xs">{j.command}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton label={t("common.delete")} onClick={() => remove(j.index)}>
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {jobs && jobs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("cron.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
