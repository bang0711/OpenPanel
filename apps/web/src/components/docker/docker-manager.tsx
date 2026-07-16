"use client";

import { useCallback, useEffect, useState } from "react";
import {
  RiDeleteBinLine,
  RiFileTextLine,
  RiLoopRightLine,
  RiPlayLine,
  RiStopLine,
} from "@remixicon/react";
import { toast } from "sonner";

import {
  api,
  ApiError,
  type DockerActionName,
  type DockerStatus,
} from "@/lib/api";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CommandOutputDialog } from "@/components/common/command-output-dialog";
import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";
import { RefreshButton } from "@/components/common/refresh-button";

export function DockerManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [data, setData] = useState<DockerStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [logsFor, setLogsFor] = useState<string | null>(null);
  const [logs, setLogs] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.docker.status(serverId));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("docker.loadFailed"),
      );
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const onAction = useCallback(
    async (id: string, name: string, action: DockerActionName) => {
      if (
        action === "rm" &&
        !confirm(t("docker.confirmRemove").replace("{name}", name))
      )
        return;
      setBusy(id + action);
      try {
        const r = await api.docker.action(serverId, id, action);
        if (r.ok) toast.success(t("docker.actionDone"));
        else toast.error(r.output || t("docker.actionFailed"));
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : t("docker.actionFailed"),
        );
      } finally {
        setBusy(null);
        load();
      }
    },
    [serverId, load, t],
  );

  const onRemoveImage = useCallback(
    async (id: string, name: string) => {
      if (!confirm(t("docker.confirmRemove").replace("{name}", name))) return;
      setBusy(id + "rmi");
      try {
        const r = await api.docker.removeImage(serverId, id);
        if (r.ok) toast.success(t("docker.actionDone"));
        else toast.error(r.output || t("docker.actionFailed"));
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : t("docker.actionFailed"),
        );
      } finally {
        setBusy(null);
        load();
      }
    },
    [serverId, load, t],
  );

  const openLogs = useCallback(
    async (id: string) => {
      setLogsFor(id);
      setLogs(t("common.loading"));
      try {
        const d = await api.docker.logs(serverId, id);
        setLogs(d.logs || t("docker.empty"));
      } catch (err) {
        setLogs(err instanceof ApiError ? err.message : t("docker.loadFailed"));
      }
    },
    [serverId, t],
  );

  if (data && !data.installed) {
    return (
      <Alert>
        <AlertTitle>{t("docker.notInstalled")}</AlertTitle>
        <AlertDescription>{t("docker.notInstalledHint")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RefreshButton onClick={load} />
      </div>

      <Tabs defaultValue="containers">
        <TabsList>
          <TabsTrigger value="containers">{t("docker.containers")}</TabsTrigger>
          <TabsTrigger value="images">{t("docker.images")}</TabsTrigger>
        </TabsList>

        <TabsContent value="containers">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("docker.colName")}</TableHead>
                  <TableHead>{t("docker.colImage")}</TableHead>
                  <TableHead>{t("docker.colState")}</TableHead>
                  <TableHead className="hidden md:table-cell">
                    {t("docker.colStatus")}
                  </TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.containers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.name}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {c.image}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.state === "running" ? "secondary" : "outline"
                        }
                      >
                        {c.state}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {c.status}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <IconButton
                          label={t("docker.start")}
                          onClick={() => onAction(c.id, c.name, "start")}
                          disabled={busy === c.id + "start"}
                        >
                          <RiPlayLine />
                        </IconButton>
                        <IconButton
                          label={t("docker.restart")}
                          onClick={() => onAction(c.id, c.name, "restart")}
                          disabled={busy === c.id + "restart"}
                        >
                          <RiLoopRightLine />
                        </IconButton>
                        <IconButton
                          label={t("docker.stop")}
                          onClick={() => onAction(c.id, c.name, "stop")}
                          disabled={busy === c.id + "stop"}
                        >
                          <RiStopLine />
                        </IconButton>
                        <IconButton
                          label={t("docker.logs")}
                          onClick={() => openLogs(c.id)}
                        >
                          <RiFileTextLine />
                        </IconButton>
                        <IconButton
                          label={t("docker.remove")}
                          onClick={() => onAction(c.id, c.name, "rm")}
                          disabled={busy === c.id + "rm"}
                        >
                          <RiDeleteBinLine />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.containers.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-xs text-muted-foreground"
                    >
                      {t("docker.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("docker.colRepo")}</TableHead>
                  <TableHead>{t("docker.colTag")}</TableHead>
                  <TableHead>{t("docker.colSize")}</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.images.map((img) => (
                  <TableRow key={img.id}>
                    <TableCell className="font-mono text-xs">
                      {img.repository}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {img.tag}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {img.size}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <IconButton
                          label={t("docker.remove")}
                          onClick={() =>
                            onRemoveImage(img.id, `${img.repository}:${img.tag}`)
                          }
                          disabled={busy === img.id + "rmi"}
                        >
                          <RiDeleteBinLine />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data && data.images.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-xs text-muted-foreground"
                    >
                      {t("docker.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <CommandOutputDialog
        title={logsFor}
        output={logs}
        onClose={() => setLogsFor(null)}
      />
    </div>
  );
}
