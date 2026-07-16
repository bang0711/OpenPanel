"use client";

import { useCallback, useEffect, useState } from "react";
import { RiPlayLine, RiTerminalBoxLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type BulkRun, type Server } from "@/lib/api";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useT } from "@/components/common/i18n-provider";
import { PageHeader } from "@/components/common/page-header";
import { PageShell } from "@/components/common/page-shell";

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

  const allSelected = servers.length > 0 && selected.size === servers.length;

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
    <PageShell>
      <PageHeader title={t("bulk.title")} description={t("bulk.subtitle")} />

      <div className="grid flex-1 items-start gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t("bulk.selectServers")}</CardTitle>
            <CardDescription>
              {t("bulk.selectedCount")
                .replace("{n}", String(selected.size))
                .replace("{total}", String(servers.length))}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {servers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("bulk.noServers")}
              </p>
            ) : (
              <div className="rounded-md border">
                <label className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                  {t("bulk.selectAll")}
                </label>
                <ScrollArea className="max-h-72">
                  <div className="p-1">
                    {servers.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <Checkbox
                          checked={selected.has(s.id)}
                          onCheckedChange={() => toggle(s.id)}
                        />
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="ml-auto truncate text-xs text-muted-foreground">
                          {s.host}
                        </span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="bulk-action">{t("bulk.action")}</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger id="bulk-action" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {t(a.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {action === "service-restart" && (
              <div className="space-y-2">
                <Label htmlFor="bulk-unit">{t("bulk.unit")}</Label>
                <Input
                  id="bulk-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={t("bulk.unitPlaceholder")}
                />
              </div>
            )}

            <Button onClick={run} disabled={running} className="w-full">
              <RiPlayLine />
              {running ? t("bulk.running") : t("bulk.run")}
            </Button>
          </CardContent>
        </Card>

        <Card className="min-h-full">
          <CardHeader>
            <CardTitle>{t("bulk.results")}</CardTitle>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <RiTerminalBoxLine />
                  </EmptyMedia>
                  <EmptyTitle>{t("bulk.noResults")}</EmptyTitle>
                  <EmptyDescription>
                    {t("bulk.noResultsDescription")}
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {results.map((r) => (
                  <div key={r.serverId} className="rounded-md border">
                    <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                      <Badge variant={r.ok ? "secondary" : "destructive"}>
                        {r.ok ? t("bulk.done") : t("bulk.failed")}
                      </Badge>
                      <span className="text-sm font-medium">
                        {r.name ?? r.serverId}
                      </span>
                    </div>
                    <pre className="max-h-64 overflow-auto p-3 font-mono text-xs whitespace-pre-wrap">
                      {r.output}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
