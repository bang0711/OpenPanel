"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDatabase2Line } from "@remixicon/react";
import { toast } from "sonner";

import {
  api,
  ApiError,
  type DbBackupEngine,
  type DbBackupEngines,
} from "@/lib/api";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CommandOutputDialog } from "@/components/common/command-output-dialog";
import { useT } from "@/components/common/i18n-provider";
import { RefreshButton } from "@/components/common/refresh-button";

const DEFAULT_DIR = "/var/backups/openpanel";

export function DbBackupManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [engines, setEngines] = useState<DbBackupEngines | null>(null);
  const [dir, setDir] = useState(DEFAULT_DIR);
  const [engine, setEngine] = useState<DbBackupEngine>("mysql");
  const [database, setDatabase] = useState("");
  const [dumps, setDumps] = useState<string[]>([]);
  const [dumping, setDumping] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    try {
      const r = await api.dbBackup.list(serverId, dir);
      setDumps(r.dumps);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("dbBackup.loadFailed"),
      );
    }
  }, [serverId, dir, t]);

  useEffect(() => {
    api.dbBackup
      .engines(serverId)
      .then((e) => {
        setEngines(e);
        setEngine(e.mysql ? "mysql" : "postgres");
      })
      .catch((err) => {
        toast.error(
          err instanceof ApiError ? err.message : t("dbBackup.loadFailed"),
        );
      });
  }, [serverId, t]);

  useEffect(() => {
    if (engines && (engines.mysql || engines.postgres)) loadList();
  }, [engines, loadList]);

  async function onDump(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDumping(true);
    try {
      const r = await api.dbBackup.dump(serverId, engine, database, dir);
      setOutput(r.output || t(r.ok ? "dbBackup.done" : "dbBackup.failed"));
      if (r.ok) toast.success(t("dbBackup.done"));
      else toast.error(t("dbBackup.failed"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("dbBackup.failed"),
      );
    } finally {
      setDumping(false);
      loadList();
    }
  }

  if (engines && !engines.mysql && !engines.postgres) {
    return (
      <Alert>
        <AlertTitle>{t("dbBackup.noEngines")}</AlertTitle>
        <AlertDescription>{t("dbBackup.noEngines")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onDump} className="space-y-3 rounded-md border p-4">
        <div className="space-y-1.5">
          <Label htmlFor="dir">{t("dbBackup.dir")}</Label>
          <Input
            id="dir"
            value={dir}
            onChange={(e) => setDir(e.target.value)}
            placeholder={DEFAULT_DIR}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t("dbBackup.engine")}</Label>
          <Tabs
            value={engine}
            onValueChange={(v) => setEngine(v as DbBackupEngine)}
          >
            <TabsList className="w-full">
              <TabsTrigger
                value="mysql"
                className="flex-1"
                disabled={!engines?.mysql}
              >
                MySQL
              </TabsTrigger>
              <TabsTrigger
                value="postgres"
                className="flex-1"
                disabled={!engines?.postgres}
              >
                PostgreSQL
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="database">{t("dbBackup.database")}</Label>
          <Input
            id="database"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            pattern="[a-zA-Z0-9_]+"
            required
            placeholder="myapp"
          />
        </div>

        <div className="flex items-center justify-between">
          <Button type="submit" size="sm" disabled={dumping || !database}>
            <RiDatabase2Line />
            {dumping ? t("dbBackup.dumping") : t("dbBackup.dump")}
          </Button>
          <RefreshButton onClick={loadList} />
        </div>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("dbBackup.colFile")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dumps.map((f) => (
              <TableRow key={f}>
                <TableCell className="font-mono text-xs">{f}</TableCell>
              </TableRow>
            ))}
            {dumps.length === 0 && (
              <TableRow>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {t("dbBackup.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CommandOutputDialog
        title={output !== null ? t("dbBackup.dump") : null}
        output={output ?? ""}
        onClose={() => setOutput(null)}
      />
    </div>
  );
}
