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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useT } from "@/components/common/i18n-provider";

type Level = "read" | "write" | "admin";

export function GrantAccessDialog({
  serverId,
  onGranted,
}: {
  serverId: string;
  onGranted: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level>("read");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    if (!email) return;
    setSaving(true);
    try {
      await api.access.grant(serverId, email, level);
      toast.success(t("access.granted"));
      setOpen(false);
      onGranted();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("access.grantFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiAddLine />
          {t("access.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("access.dialogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t("access.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              maxLength={254}
              required
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("access.level")}</Label>
            <Tabs value={level} onValueChange={(v) => setLevel(v as Level)}>
              <TabsList className="w-full">
                <TabsTrigger value="read" className="flex-1">
                  {t("access.read")}
                </TabsTrigger>
                <TabsTrigger value="write" className="flex-1">
                  {t("access.write")}
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex-1">
                  {t("access.admin")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("access.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
