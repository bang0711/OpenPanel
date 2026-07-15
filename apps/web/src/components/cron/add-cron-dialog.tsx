"use client";

import { useState } from "react";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useT } from "@/components/common/i18n-provider";

export function AddCronDialog({
  serverId,
  onAdded,
}: {
  serverId: string;
  onAdded: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.cron.add(
        serverId,
        String(form.get("schedule")),
        String(form.get("command")),
      );
      toast.success(t("cron.added"));
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("cron.addFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiAddLine />
          {t("cron.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("cron.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("cron.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="schedule">{t("cron.schedule")}</Label>
            <Input
              id="schedule"
              name="schedule"
              required
              placeholder="0 3 * * *"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="command">{t("cron.command")}</Label>
            <Input
              id="command"
              name="command"
              required
              placeholder="/usr/bin/backup.sh"
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("cron.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
