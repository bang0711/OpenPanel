"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type DnsStatus } from "@/lib/api";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { CommandOutputDialog } from "@/components/common/command-output-dialog";
import { useT } from "@/components/common/i18n-provider";
import { RefreshButton } from "@/components/common/refresh-button";

export function DnsManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [status, setStatus] = useState<DnsStatus | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkOutput, setCheckOutput] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await api.dns.status(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("dns.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const open = useCallback(
    async (path: string) => {
      setSelected(path);
      setContent("");
      try {
        const r = await api.dns.read(serverId, path);
        setContent(r.content);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : t("dns.loadFailed"));
      }
    },
    [serverId, t],
  );

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const r = await api.dns.write(
        serverId,
        selected,
        content,
        zoneName.trim() || undefined,
      );
      if (r.ok) toast.success(t("dns.saved"));
      else toast.error(t("dns.saveFailed"));
      // Surface named-checkzone output whenever a zone name was checked.
      if (r.output) setCheckOutput(r.output);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("dns.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (status && !status.installed) {
    return (
      <Alert>
        <AlertTitle>{t("dns.notInstalled")}</AlertTitle>
        <AlertDescription>{t("dns.notInstalledHint")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <RefreshButton onClick={load} />
      </div>

      <div className="grid gap-4 md:grid-cols-[16rem_1fr]">
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            {t("dns.zones")}
          </div>
          <div className="rounded-md border">
            {status?.zones.map((z) => (
              <button
                key={z}
                onClick={() => open(z)}
                className={`block w-full truncate px-3 py-2 text-left font-mono text-xs hover:bg-muted/50 ${
                  selected === z ? "bg-muted" : ""
                }`}
              >
                {z}
              </button>
            ))}
            {status && status.zones.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {t("dns.empty")}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          {selected ? (
            <>
              <Input
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder={t("dns.zoneNamePlaceholder")}
                aria-label={t("dns.zoneName")}
                className="font-mono text-xs"
              />
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="font-mono text-xs"
                aria-label={t("dns.content")}
              />
              <div className="flex justify-end">
                <Button onClick={save} disabled={saving}>
                  {saving ? t("common.saving") : t("dns.save")}
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-md border p-6 text-center text-xs text-muted-foreground">
              {t("dns.selectZone")}
            </div>
          )}
        </div>
      </div>

      <CommandOutputDialog
        title={checkOutput !== null ? "named-checkzone" : null}
        output={checkOutput ?? ""}
        onClose={() => setCheckOutput(null)}
      />
    </div>
  );
}
