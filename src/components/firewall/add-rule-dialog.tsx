"use client";

import { useState } from "react";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type FwAction, type FwProtocol } from "@/lib/api";

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

type Proto = "any" | FwProtocol;

export function AddRuleDialog({
  serverId,
  onAdded,
}: {
  serverId: string;
  onAdded: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<FwAction>("allow");
  const [proto, setProto] = useState<Proto>("any");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const port = Number(form.get("port"));
    setSaving(true);
    try {
      await api.firewall.setRule(
        serverId,
        action,
        port,
        proto === "any" ? undefined : proto,
      );
      toast.success(t("firewall.ruleAdded"));
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("firewall.addFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiAddLine />
          {t("firewall.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("firewall.dialogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>{t("firewall.action")}</Label>
            <Tabs value={action} onValueChange={(v) => setAction(v as FwAction)}>
              <TabsList className="w-full">
                <TabsTrigger value="allow" className="flex-1">
                  {t("firewall.allow")}
                </TabsTrigger>
                <TabsTrigger value="deny" className="flex-1">
                  {t("firewall.deny")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="port">{t("firewall.port")}</Label>
            <Input
              id="port"
              name="port"
              type="number"
              min={1}
              max={65535}
              required
              placeholder="22"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("firewall.protocol")}</Label>
            <Tabs value={proto} onValueChange={(v) => setProto(v as Proto)}>
              <TabsList className="w-full">
                <TabsTrigger value="any" className="flex-1">
                  {t("firewall.any")}
                </TabsTrigger>
                <TabsTrigger value="tcp" className="flex-1">
                  {t("firewall.tcp")}
                </TabsTrigger>
                <TabsTrigger value="udp" className="flex-1">
                  {t("firewall.udp")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("firewall.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
