"use client";

import { useState } from "react";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type DbEngine } from "@/lib/api";

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

import { useT } from "@/components/common/i18n-provider";

export function CreateDbDialog({
  serverId,
  engine,
  onDone,
}: {
  serverId: string;
  engine: DbEngine;
  onDone: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    setSaving(true);
    try {
      await api.db.createDatabase(serverId, engine, name);
      toast.success(t("db.created"));
      setOpen(false);
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("db.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiAddLine />
          {t("db.createDb")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("db.createDb")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="name">{t("db.dbName")}</Label>
            <Input
              id="name"
              name="name"
              required
              maxLength={64}
              pattern="[a-zA-Z0-9_]+"
              placeholder="app_db"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("db.createDb")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
