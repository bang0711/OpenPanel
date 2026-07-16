"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type DbEngine, type DbEngines } from "@/lib/api";

import { Alert, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";
import { RefreshButton } from "@/components/common/refresh-button";

import { CreateDbDialog } from "./create-db-dialog";
import { DbUserDialog } from "./db-user-dialog";

const ALL_ENGINES: DbEngine[] = ["mysql", "postgres"];

export function DbManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [engines, setEngines] = useState<DbEngines | null>(null);
  const [engine, setEngine] = useState<DbEngine | null>(null);
  const [databases, setDatabases] = useState<string[]>([]);

  const loadEngines = useCallback(async () => {
    try {
      const found = await api.db.engines(serverId);
      setEngines(found);
      setEngine((prev) =>
        prev ?? (found.mysql ? "mysql" : found.postgres ? "postgres" : null),
      );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("db.loadFailed"));
    }
  }, [serverId, t]);

  const loadDatabases = useCallback(async () => {
    if (!engine) return;
    try {
      setDatabases(await api.db.databases(serverId, engine));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("db.loadFailed"));
    }
  }, [serverId, engine, t]);

  useEffect(() => {
    loadEngines();
  }, [loadEngines]);

  useEffect(() => {
    loadDatabases();
  }, [loadDatabases]);

  async function drop(name: string) {
    if (!engine) return;
    if (!confirm(t("db.confirmDrop").replace("{name}", name))) return;
    try {
      await api.db.dropDatabase(serverId, engine, name);
      toast.success(t("db.dropped"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("db.dropFailed"));
    } finally {
      loadDatabases();
    }
  }

  const available = engines
    ? ALL_ENGINES.filter((e) => engines[e])
    : [];

  if (engines && available.length === 0) {
    return (
      <Alert>
        <AlertTitle>{t("db.noEngines")}</AlertTitle>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("db.engine")}</span>
          {engine && available.length > 0 && (
            <Tabs
              value={engine}
              onValueChange={(v) => setEngine(v as DbEngine)}
            >
              <TabsList>
                {available.map((e) => (
                  <TabsTrigger key={e} value={e}>
                    {t(`db.${e}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>
        <div className="flex gap-2">
          {engine && (
            <CreateDbDialog
              serverId={serverId}
              engine={engine}
              onDone={loadDatabases}
            />
          )}
          {engine && (
            <DbUserDialog
              serverId={serverId}
              engine={engine}
              databases={databases}
            />
          )}
          <RefreshButton onClick={loadDatabases} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("db.colDatabase")}</TableHead>
              <TableHead className="text-right">{t("db.drop")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {databases.map((d) => (
              <TableRow key={d}>
                <TableCell className="font-mono text-xs">{d}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton label={t("db.drop")} onClick={() => drop(d)}>
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {engine && databases.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("db.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
