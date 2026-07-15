"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type SshKey } from "@/lib/api";

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

import { AddSshKeyDialog } from "./add-ssh-key-dialog";

export function SshKeysManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [keys, setKeys] = useState<SshKey[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.sshKeys.list(serverId);
      setKeys(res.keys);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("sshKeys.loadFailed"),
      );
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(index: number) {
    if (!confirm(t("sshKeys.confirmDelete"))) return;
    try {
      await api.sshKeys.remove(serverId, index);
      toast.success(t("sshKeys.removed"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("sshKeys.removeFailed"),
      );
    } finally {
      load();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <AddSshKeyDialog serverId={serverId} onAdded={load} />
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">{t("sshKeys.colType")}</TableHead>
              <TableHead>{t("sshKeys.colComment")}</TableHead>
              <TableHead className="w-32">{t("sshKeys.colKey")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys?.map((k, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-xs">{k.type}</TableCell>
                <TableCell className="text-xs">{k.comment}</TableCell>
                <TableCell className="font-mono text-xs">
                  …{k.preview}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton
                      label={t("common.delete")}
                      onClick={() => remove(i)}
                    >
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {keys && keys.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("sshKeys.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
