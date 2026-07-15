"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { CommandOutputDialog } from "@/components/common/command-output-dialog";
import { useT } from "@/components/common/i18n-provider";

export function EditSiteDialog({
  serverId,
  site,
  onClose,
}: {
  serverId: string;
  site: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);

  useEffect(() => {
    if (!site) return;
    setLoading(true);
    api.vhost
      .read(serverId, site)
      .then((r) => setContent(r.content))
      .catch((err) =>
        toast.error(err instanceof ApiError ? err.message : t("vhost.loadFailed")),
      )
      .finally(() => setLoading(false));
  }, [serverId, site, t]);

  async function save() {
    if (!site) return;
    setSaving(true);
    try {
      const r = await api.vhost.write(serverId, site, content);
      if (r.ok) toast.success(t("vhost.saved"));
      else toast.error(t("vhost.saveFailed"));
      // Always surface `nginx -t` output so a failed test is visible.
      if (r.output) setTestOutput(r.output);
      if (r.ok) onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("vhost.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog open={!!site} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">
              {t("vhost.editTitle")}: {site}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            disabled={loading}
            className="font-mono text-xs"
            aria-label={t("vhost.content")}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button onClick={save} disabled={saving || loading}>
              {saving ? t("common.saving") : t("vhost.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CommandOutputDialog
        title={testOutput !== null ? "nginx -t" : null}
        output={testOutput ?? ""}
        onClose={() => setTestOutput(null)}
      />
    </>
  );
}
