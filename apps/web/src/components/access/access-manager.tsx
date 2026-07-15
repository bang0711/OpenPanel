"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type ServerGrant } from "@/lib/api";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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

import { GrantAccessDialog } from "./grant-access-dialog";

export function AccessManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [grants, setGrants] = useState<ServerGrant[] | null>(null);
  const [forbidden, setForbidden] = useState(false);

  const load = useCallback(async () => {
    try {
      setGrants(await api.access.list(serverId));
      setForbidden(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
        return;
      }
      toast.error(err instanceof ApiError ? err.message : t("access.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const revoke = useCallback(
    async (g: ServerGrant) => {
      if (!confirm(t("access.confirmRevoke").replace("{email}", g.email))) return;
      try {
        await api.access.revoke(serverId, g.id);
        toast.success(t("access.revoked"));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : t("access.revokeFailed"));
      } finally {
        load();
      }
    },
    [serverId, t, load],
  );

  if (forbidden) {
    return (
      <Alert>
        <AlertDescription>{t("access.forbidden")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <GrantAccessDialog serverId={serverId} onGranted={load} />
        <RefreshButton onClick={load} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("access.colUser")}</TableHead>
              <TableHead>{t("access.colLevel")}</TableHead>
              <TableHead className="text-right">{t("common.delete")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grants?.map((g) => (
              <TableRow key={g.id}>
                <TableCell>
                  <div className="text-sm">{g.name}</div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {g.email}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{t(`access.${g.level}`)}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton
                      label={t("common.delete")}
                      onClick={() => revoke(g)}
                    >
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {grants && grants.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("access.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
