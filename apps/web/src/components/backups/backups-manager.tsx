"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine, RiPlayLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type BackupJob } from "@/lib/api";

import { Switch } from "@/components/ui/switch";
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

import { AddBackupDialog } from "./add-backup-dialog";

export function BackupsManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [jobs, setJobs] = useState<BackupJob[] | null>(null);
  const [output, setOutput] = useState<{ title: string; body: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      setJobs(await api.backups.list(serverId));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("backups.loadFailed"),
      );
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(job: BackupJob, enabled: boolean) {
    try {
      await api.backups.setEnabled(serverId, job.id, enabled);
      toast.success(t("backups.toggled"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("backups.runFailed"),
      );
    } finally {
      load();
    }
  }

  async function runNow(job: BackupJob) {
    try {
      const res = await api.backups.runNow(serverId, job.id);
      toast[res.ok ? "success" : "error"](
        res.ok ? t("backups.ran") : t("backups.runFailed"),
      );
      setOutput({ title: `${job.kind}: ${job.source}`, body: res.output });
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("backups.runFailed"),
      );
    } finally {
      load();
    }
  }

  async function remove(job: BackupJob) {
    if (!confirm(t("backups.confirmDelete"))) return;
    try {
      await api.backups.remove(serverId, job.id);
      toast.success(t("backups.removed"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("backups.removeFailed"),
      );
    } finally {
      load();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <AddBackupDialog serverId={serverId} onAdded={load} />
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">{t("backups.colKind")}</TableHead>
              <TableHead>{t("backups.colSource")}</TableHead>
              <TableHead>{t("backups.colTarget")}</TableHead>
              <TableHead className="w-24">{t("backups.colInterval")}</TableHead>
              <TableHead className="w-20">{t("backups.enabled")}</TableHead>
              <TableHead>{t("backups.colLastRun")}</TableHead>
              <TableHead className="text-right">
                {t("common.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs?.map((j) => (
              <TableRow key={j.id}>
                <TableCell className="text-xs">{j.kind}</TableCell>
                <TableCell className="font-mono text-xs">{j.source}</TableCell>
                <TableCell className="font-mono text-xs">{j.target}</TableCell>
                <TableCell className="text-xs">{j.intervalMins}m</TableCell>
                <TableCell>
                  <Switch
                    checked={j.enabled}
                    onCheckedChange={(v) => toggle(j, v)}
                  />
                </TableCell>
                <TableCell className="text-xs">
                  {j.lastRunAt ? (
                    <span>
                      {new Date(j.lastRunAt).toLocaleString()}
                      {j.lastStatus ? ` · ${j.lastStatus}` : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {t("backups.never")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <IconButton
                      label={t("backups.runNow")}
                      onClick={() => runNow(j)}
                    >
                      <RiPlayLine />
                    </IconButton>
                    <IconButton
                      label={t("common.delete")}
                      onClick={() => remove(j)}
                    >
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {jobs && jobs.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("backups.empty")}
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
