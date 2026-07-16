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

import { useT } from "@/components/common/i18n-provider";

export function IssueCertDialog({
  serverId,
  onIssued,
}: {
  serverId: string;
  onIssued: (output: string) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const domain = String(form.get("domain") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    setSaving(true);
    try {
      const r = await api.ssl.issue(serverId, domain, email);
      if (r.ok) toast.success(t("ssl.issued"));
      else toast.error(r.output || t("ssl.issueFailed"));
      setOpen(false);
      onIssued(r.output);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("ssl.issueFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiAddLine />
          {t("ssl.issue")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("ssl.dialogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="domain">{t("ssl.domain")}</Label>
            <Input
              id="domain"
              name="domain"
              required
              placeholder="example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">{t("ssl.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@example.com"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("ssl.issue")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
