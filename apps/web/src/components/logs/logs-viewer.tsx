"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type LogSource } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useT } from "@/components/common/i18n-provider";

const LINE_OPTIONS = [100, 500, 1000];
const SELECT_CLS =
  "h-7 rounded-md border border-input bg-input/20 px-2 text-xs/relaxed outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30";

// Map an allowlist key ("nginx-access") to its i18n suffix ("nginxAccess").
function srcKey(key: string) {
  return `logs.src.${key.replace(/-(\w)/g, (_, c: string) => c.toUpperCase())}`;
}

export function LogsViewer({ serverId }: { serverId: string }) {
  const t = useT();
  const [sources, setSources] = useState<LogSource[]>([]);
  const [source, setSource] = useState("syslog");
  const [lines, setLines] = useState(500);
  const [unit, setUnit] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.logs
      .sources(serverId)
      .then(setSources)
      .catch(() => {});
  }, [serverId]);

  const run = useCallback(
    async (src: string, n: number, u: string) => {
      if (src === "unit" && !u) return;
      setLoading(true);
      try {
        const r = await api.logs.tail(
          serverId,
          src,
          n,
          src === "unit" ? u : undefined,
        );
        setContent(r.content);
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : t("logs.loadFailed"),
        );
      } finally {
        setLoading(false);
      }
    },
    [serverId, t],
  );

  // Auto-load fixed sources on change; "unit" waits for an explicit refresh.
  useEffect(() => {
    if (source !== "unit") run(source, lines, "");
    else setContent("");
  }, [source, lines, run]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {t("logs.source")}
          </span>
          <select
            className={SELECT_CLS}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            {sources.map((s) => (
              <option key={s.key} value={s.key}>
                {t(srcKey(s.key))}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            {t("logs.lines")}
          </span>
          <select
            className={SELECT_CLS}
            value={lines}
            onChange={(e) => setLines(Number(e.target.value))}
          >
            {LINE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        {source === "unit" && (
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {t("logs.unit")}
            </span>
            <Input
              className="w-52"
              placeholder={t("logs.unitPlaceholder")}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </label>
        )}

        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => run(source, lines, unit)}
        >
          {t("logs.refresh")}
        </Button>
      </div>

      <ScrollArea className="h-[28rem] rounded-md border bg-muted/30 p-3">
        <pre className="font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap">
          {content || t("logs.empty")}
        </pre>
      </ScrollArea>
    </div>
  );
}
