"use client";

import { useEffect, useState } from "react";
import { RiPlayLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type QueryEngines, type QueryResult } from "@/lib/api";

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
import { Textarea } from "@/components/ui/textarea";

import { useT } from "@/components/common/i18n-provider";

type Engine = "mysql" | "postgres";
const ENGINE_ORDER: Engine[] = ["mysql", "postgres"];
const ENGINE_LABELS: Record<Engine, string> = {
  mysql: "MySQL",
  postgres: "PostgreSQL",
};

export function QueryConsole({ serverId }: { serverId: string }) {
  const t = useT();
  const [engines, setEngines] = useState<QueryEngines | null>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [database, setDatabase] = useState("");
  const [sql, setSql] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);

  useEffect(() => {
    api.query
      .engines(serverId)
      .then((e) => {
        setEngines(e);
        setEngine(ENGINE_ORDER.find((k) => e[k]) ?? null);
      })
      .catch(() => toast.error(t("query.loadFailed")));
  }, [serverId, t]);

  const available = engines
    ? ENGINE_ORDER.filter((k) => engines[k])
    : [];

  async function run() {
    if (!engine || !sql.trim()) return;
    setRunning(true);
    try {
      const r = await api.query.run(
        serverId,
        engine,
        database.trim() || undefined,
        sql,
      );
      setResult(r);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("query.failed"));
    } finally {
      setRunning(false);
    }
  }

  if (engines && available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("query.noEngines")}</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">{t("query.engine")}</Label>
          <div className="flex gap-1">
            {available.map((k) => (
              <Button
                key={k}
                size="sm"
                variant={engine === k ? "default" : "outline"}
                onClick={() => setEngine(k)}
              >
                {ENGINE_LABELS[k]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs" htmlFor="query-db">
            {t("query.database")}
          </Label>
          <Input
            id="query-db"
            className="w-48"
            placeholder={t("query.databasePlaceholder")}
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs" htmlFor="query-sql">
          {t("query.sql")}
        </Label>
        <Textarea
          id="query-sql"
          className="min-h-32 font-mono"
          placeholder={t("query.sqlPlaceholder")}
          value={sql}
          onChange={(e) => setSql(e.target.value)}
        />
      </div>

      <Button size="sm" disabled={running || !engine || !sql.trim()} onClick={run}>
        <RiPlayLine />
        {running ? t("query.running") : t("query.run")}
      </Button>

      {result &&
        (result.error ? (
          <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap text-destructive">
            {result.raw}
          </pre>
        ) : result.columns.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("query.empty")}</p>
        ) : (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              {t("query.rows").replace("{count}", String(result.rows.length))}
            </p>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {result.columns.map((c, i) => (
                      <TableHead key={i} className="font-mono text-xs">
                        {c}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row, ri) => (
                    <TableRow key={ri}>
                      {result.columns.map((_, ci) => (
                        <TableCell key={ci} className="font-mono text-xs">
                          {row[ci] ?? ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
    </div>
  );
}
