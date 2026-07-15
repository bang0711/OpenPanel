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

export function FileEditorDialog({
  serverId,
  file,
  onClose,
}: {
  serverId: string;
  file: { path: string; content: string } | null;
  onClose: () => void;
}) {
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
      toast.success("Saved");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Save failed");
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
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
