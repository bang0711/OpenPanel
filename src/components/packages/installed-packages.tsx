"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
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
import { IconButton } from "@/components/common/icon-button";
import { RefreshButton } from "@/components/common/refresh-button";

export function InstalledPackages({ serverId }: { serverId: string }) {
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
      toast.error(err instanceof ApiError ? err.message : "Failed to load");
    }
  }, [serverId]);

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
    if (!confirm(`Remove ${name}?`)) return;
    setBusy(true);
    try {
      const r = await api.packages.remove(serverId, name);
      setOutput({ title: `remove ${name}`, body: r.output });
      if (r.ok) toast.success(`Removed ${name}`);
      else toast.error("Remove failed — see output");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Remove failed");
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
      toast.success("Package index refreshed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Refresh failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter installed…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-xs"
          />
          {manager && <Badge variant="secondary">{manager}</Badge>}
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={refreshIndex} label="Update index" />
          <RefreshButton onClick={load} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package</TableHead>
              <TableHead>Version</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((p) => (
              <TableRow key={p.name}>
                <TableCell className="font-mono text-xs">{p.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.version}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton
                      label="Remove"
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
                    ? "No package manager detected."
                    : "No packages match."}
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
