"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type BulkRun, type Server } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useT } from "@/components/common/i18n-provider";

const ACTIONS = [
  { value: "uptime", key: "bulk.actionUptime" },
  { value: "disk", key: "bulk.actionDisk" },
  { value: "update-packages", key: "bulk.actionUpdate" },
  { value: "service-restart", key: "bulk.actionRestart" },
] as const;

export function BulkRunner() {
  const t = useT();
  const [servers, setServers] = useState<Server[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<string>("uptime");
  const [unit, setUnit] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<BulkRun["results"]>([]);

  useEffect(() => {
    api.server
      .list()
      .then(setServers)
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : t("common.failed")),
      );
  }, [t]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected =
    servers.length > 0 && selected.size === servers.length;

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === servers.length
        ? new Set()
        : new Set(servers.map((s) => s.id)),
    );
  }, [servers]);

  const run = useCallback(async () => {
    if (selected.size === 0) {
      toast.error(t("bulk.noSelection"));
      return;
    }
    setRunning(true);
    try {
      const r = await api.bulk.run(
        [...selected],
        action,
        action === "service-restart" ? unit : undefined,
      );
      setResults(r.results);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.failed"));
    } finally {
      setRunning(false);
    }
  }, [selected, action, unit, t]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-lg font-semibold">{t("bulk.title")}</h1>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("bulk.selectServers")}</Label>
          {servers.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
              />
              {t("bulk.selectAll")}
            </label>
          )}
        </div>
        {servers.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("bulk.noServers")}</p>
        ) : (
          <div className="space-y-1 rounded-lg border p-3">
            {servers.map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <span className="font-medium">{s.name}</span>
                <span className="text-xs text-muted-foreground">
                  {s.host}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="bulk-action">{t("bulk.action")}</Label>
          <select
            id="bulk-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="h-7 rounded-md border border-border bg-transparent px-2 text-xs"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {t(a.key)}
              </option>
            ))}
          </select>
        </div>

        {action === "service-restart" && (
          <div className="space-y-1">
            <Label htmlFor="bulk-unit">{t("bulk.unit")}</Label>
            <Input
              id="bulk-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder={t("bulk.unitPlaceholder")}
              className="h-7 w-40"
            />
          </div>
        )}

        <Button onClick={run} disabled={running}>
          {running ? t("bulk.running") : t("bulk.run")}
        </Button>
      </div>

      {results.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("bulk.colServer")}</TableHead>
              <TableHead>{t("bulk.colResult")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.serverId}>
                <TableCell className="align-top">
                  <div className="flex items-center gap-2">
                    <Badge variant={r.ok ? "secondary" : "destructive"}>
                      {r.ok ? t("bulk.done") : t("bulk.failed")}
                    </Badge>
                    <span className="font-medium">{r.name ?? r.serverId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <pre className="max-h-40 overflow-auto font-mono text-[0.7rem] whitespace-pre-wrap">
                    {r.output}
                  </pre>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
