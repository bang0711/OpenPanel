"use client";

import { useState } from "react";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useT } from "@/components/common/i18n-provider";

export function AddBackupDialog({
  serverId,
  onAdded,
}: {
  serverId: string;
  onAdded: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kind, setKind] = useState<"files" | "db">("files");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.backups.create(serverId, {
        kind,
        source: String(form.get("source")).trim(),
        target: String(form.get("target")).trim(),
        intervalMins: Number(form.get("intervalMins")),
      });
      toast.success(t("backups.created"));
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("backups.createFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiAddLine />
          {t("backups.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("backups.dialogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="kind">{t("backups.kind")}</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as "files" | "db")}>
              <SelectTrigger id="kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="files">{t("backups.files")}</SelectItem>
                <SelectItem value="db">{t("backups.db")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="source">{t("backups.source")}</Label>
            <Input
              id="source"
              name="source"
              required
              placeholder={kind === "db" ? "mydb" : "/var/www"}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {kind === "db"
                ? t("backups.sourceHintDb")
                : t("backups.sourceHintFiles")}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="target">{t("backups.target")}</Label>
            <Input
              id="target"
              name="target"
              required
              placeholder="/var/backups"
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="intervalMins">{t("backups.interval")}</Label>
            <Input
              id="intervalMins"
              name="intervalMins"
              type="number"
              required
              min={5}
              max={100000}
              defaultValue={1440}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("backups.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
