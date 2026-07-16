"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useT } from "@/components/common/i18n-provider";

export function AddProxyDialog({
  serverId,
  open,
  onClose,
  onCreated,
}: {
  serverId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (output: string) => void;
}) {
  const t = useT();
  const [name, setName] = useState("");
  const [serverName, setServerName] = useState("");
  const [upstreamHost, setUpstreamHost] = useState("");
  const [upstreamPort, setUpstreamPort] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.proxy.create(serverId, {
        name,
        serverName,
        upstreamHost,
        upstreamPort: Number(upstreamPort),
      });
      if (r.ok) toast.success(t("proxy.created"));
      else toast.error(r.output || t("proxy.createFailed"));
      onCreated(r.output);
      if (r.ok) {
        setName("");
        setServerName("");
        setUpstreamHost("");
        setUpstreamPort("");
        onClose();
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("proxy.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">{t("proxy.dialogTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="proxy-name">{t("proxy.name")}</Label>
            <Input
              id="proxy-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-mono"
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proxy-server-name">{t("proxy.serverName")}</Label>
            <Input
              id="proxy-server-name"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="font-mono"
              placeholder="example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proxy-upstream-host">{t("proxy.upstreamHost")}</Label>
            <Input
              id="proxy-upstream-host"
              value={upstreamHost}
              onChange={(e) => setUpstreamHost(e.target.value)}
              className="font-mono"
              placeholder="127.0.0.1"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="proxy-upstream-port">{t("proxy.upstreamPort")}</Label>
            <Input
              id="proxy-upstream-port"
              type="number"
              min={1}
              max={65535}
              value={upstreamPort}
              onChange={(e) => setUpstreamPort(e.target.value)}
              className="font-mono"
              placeholder="3000"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("proxy.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
