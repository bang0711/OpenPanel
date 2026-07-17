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

const SHELLS = ["/bin/bash", "/bin/sh", "/usr/sbin/nologin", "/bin/false"];
// Sentinel for "no shell specified" — Radix Select forbids an empty item value.
const DEFAULT_SHELL = "default";

export function AddUserDialog({
  serverId,
  onAdded,
}: {
  serverId: string;
  onAdded: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [shell, setShell] = useState(DEFAULT_SHELL);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.users.create(
        serverId,
        String(form.get("username")),
        shell === DEFAULT_SHELL ? undefined : shell,
      );
      toast.success(t("users.created"));
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("users.createFailed"),
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
          {t("users.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("users.dialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="username">{t("users.username")}</Label>
            <Input
              id="username"
              name="username"
              required
              pattern="[a-z_][a-z0-9_-]{0,31}"
              placeholder="deploy"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shell">{t("users.shell")}</Label>
            <Select value={shell} onValueChange={setShell}>
              <SelectTrigger id="shell" className="w-full font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_SHELL}>—</SelectItem>
                {SHELLS.map((s) => (
                  <SelectItem key={s} value={s} className="font-mono">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("users.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
