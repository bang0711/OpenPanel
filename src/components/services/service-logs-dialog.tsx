"use client";

import { useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useT } from "@/components/common/i18n-provider";

export function ServiceLogsDialog({
  serverId,
  unit,
  onClose,
}: {
  serverId: string;
  unit: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const [logs, setLogs] = useState(t("common.loading"));

  useEffect(() => {
    if (!unit) return;
    setLogs(t("common.loading"));
    api.services
      .logs(serverId, unit)
      .then((d) => setLogs(d.logs || t("services.logs.none")))
      .catch((err) =>
        setLogs(
          err instanceof ApiError ? err.message : t("services.logs.failed"),
        ),
      );
  }, [serverId, unit, t]);

  return (
    <Dialog open={!!unit} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{unit}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 rounded-md border bg-muted/30 p-3">
          <pre className="font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap">
            {logs}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
