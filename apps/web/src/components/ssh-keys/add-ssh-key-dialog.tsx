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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useT } from "@/components/common/i18n-provider";

export function AddSshKeyDialog({
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
      await api.sshKeys.add(serverId, String(form.get("publicKey")));
      toast.success(t("sshKeys.added"));
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("sshKeys.addFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiAddLine />
          {t("sshKeys.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("sshKeys.dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="publicKey">{t("sshKeys.publicKey")}</Label>
            <Textarea
              id="publicKey"
              name="publicKey"
              required
              rows={4}
              placeholder={t("sshKeys.placeholder")}
              className="font-mono"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("sshKeys.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
