"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RiBox3Line, RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type InstalledPackage, type PkgManager } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

export function InstalledPackages({ serverId }: { serverId: string }) {
  const t = useT();
  const [pkgs, setPkgs] = useState<InstalledPackage[] | null>(null);
  const [manager, setManager] = useState<PkgManager | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<{ title: string; body: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      const r = await api.packages.installed(serverId);
      setPkgs(r.packages);
      setManager(r.manager);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("packages.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = filter.toLowerCase();
    return (pkgs ?? [])
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 500);
  }, [pkgs, filter]);

  async function remove(name: string) {
    if (!confirm(t("packages.removeConfirm").replace("{name}", name))) return;
    setBusy(true);
    try {
      const r = await api.packages.remove(serverId, name);
      setOutput({ title: `remove ${name}`, body: r.output });
      if (r.ok) toast.success(t("packages.removed").replace("{name}", name));
      else toast.error(t("packages.removeFailedOutput"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("packages.removeFailed"));
    } finally {
      setBusy(false);
      load();
    }
  }

  async function refreshIndex() {
    setBusy(true);
    try {
      const r = await api.packages.refresh(serverId);
      setOutput({ title: "refresh package index", body: r.output });
      toast.success(t("packages.indexRefreshed"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("packages.refreshFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("packages.filterPlaceholder")}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          {manager && <Badge variant="secondary">{manager}</Badge>}
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={refreshIndex} label={t("packages.updateIndex")} />
          <RefreshButton onClick={load} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("packages.col.package")}</TableHead>
              <TableHead>{t("packages.col.version")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((p) => (
              <TableRow key={p.name}>
                <TableCell className="font-mono text-xs">
                  <span className="flex items-center gap-2">
                    <RiBox3Line className="size-3.5 shrink-0 text-muted-foreground" />
                    {p.name}
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.version}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton
                      label={t("common.remove")}
                      disabled={busy}
                      onClick={() => remove(p.name)}
                    >
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pkgs && shown.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-xs text-muted-foreground"
                >
                  {pkgs.length === 0
                    ? t("packages.noManager")
                    : t("packages.noMatch")}
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
