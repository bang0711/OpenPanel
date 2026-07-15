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

import { useT } from "@/components/common/i18n-provider";

export function FileEditorDialog({
  serverId,
  file,
  onClose,
}: {
  serverId: string;
  file: { path: string; content: string } | null;
  onClose: () => void;
}) {
  const t = useT();
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(file?.content ?? "");
  }, [file]);

  async function save() {
    if (!file) return;
    setSaving(true);
    try {
      await api.files.write(serverId, file.path, content);
      toast.success(t("files.saved"));
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("files.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{file?.path}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          className="font-mono text-xs"
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
