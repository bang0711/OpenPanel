"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type SysUser } from "@/lib/api";

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

import { AddUserDialog } from "./add-user-dialog";

export function UsersManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [users, setUsers] = useState<SysUser[] | null>(null);
  // Tracks sudo grants made this session (list() doesn't report group membership).
  const [sudoOn, setSudoOn] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try {
      setUsers(await api.users.list(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("users.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(name: string) {
    if (!confirm(t("users.confirmDelete").replace("{name}", name))) return;
    try {
      await api.users.remove(serverId, name);
      toast.success(t("users.removed"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("users.removeFailed"),
      );
    } finally {
      load();
    }
  }

  async function toggleSudo(name: string) {
    const enable = !sudoOn[name];
    try {
      await api.users.setSudo(serverId, name, enable);
      setSudoOn((s) => ({ ...s, [name]: enable }));
      toast.success(t("users.sudoUpdated"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("users.loadFailed"),
      );
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <AddUserDialog serverId={serverId} onAdded={load} />
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.colUser")}</TableHead>
              <TableHead className="w-20">{t("users.colUid")}</TableHead>
              <TableHead>{t("users.colHome")}</TableHead>
              <TableHead>{t("users.colShell")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u.name}>
                <TableCell className="font-mono text-xs">{u.name}</TableCell>
                <TableCell className="font-mono text-xs">{u.uid}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {u.home}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {u.shell}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSudo(u.name)}
                    >
                      {sudoOn[u.name]
                        ? t("users.revokeSudo")
                        : t("users.grantSudo")}
                    </Button>
                    <IconButton
                      label={t("common.delete")}
                      onClick={() => remove(u.name)}
                    >
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {users && users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("users.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
