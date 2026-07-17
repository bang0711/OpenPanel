"use client";

import { useState } from "react";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";

import { type AlertChannel,api, ApiError } from "@/lib/api";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useT } from "@/components/common/i18n-provider";

const METRICS = ["cpu", "mem", "disk", "service"] as const;
type Metric = (typeof METRICS)[number];

export function AddAlertDialog({
  serverId,
  channels,
  onAdded,
}: {
  serverId: string;
  channels: AlertChannel[];
  onAdded: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [metric, setMetric] = useState<Metric>("cpu");
  const [op, setOp] = useState<">" | "<">(">");
  // "none" is a sentinel: Radix Select forbids an empty item value, so the
  // "no channel" choice can't be "". Mapped back to undefined on submit.
  const [channelId, setChannelId] = useState("none");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const threshold = Number(form.get("threshold"));
    const target = String(form.get("target") ?? "").trim();
    setSaving(true);
    try {
      await api.alerts.create(serverId, {
        metric,
        op,
        threshold,
        target: target || undefined,
        channelId: channelId === "none" ? undefined : channelId,
      });
      toast.success(t("alerts.created"));
      setOpen(false);
      onAdded();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("alerts.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <RiAddLine />
          {t("alerts.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("alerts.dialogTitle")}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label>{t("alerts.metric")}</Label>
            <Tabs value={metric} onValueChange={(v) => setMetric(v as Metric)}>
              <TabsList className="w-full">
                {METRICS.map((m) => (
                  <TabsTrigger key={m} value={m} className="flex-1">
                    {t(`alerts.${m}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label>{t("alerts.op")}</Label>
            <Tabs value={op} onValueChange={(v) => setOp(v as ">" | "<")}>
              <TabsList className="w-full">
                <TabsTrigger value=">" className="flex-1">
                  {">"}
                </TabsTrigger>
                <TabsTrigger value="<" className="flex-1">
                  {"<"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="threshold">{t("alerts.threshold")}</Label>
            <Input
              id="threshold"
              name="threshold"
              type="number"
              step="any"
              required
              placeholder="80"
            />
          </div>

          {metric === "service" && (
            <div className="space-y-1.5">
              <Label htmlFor="target">{t("alerts.target")}</Label>
              <Input
                id="target"
                name="target"
                required
                placeholder="nginx"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="channelId">{t("alerts.channel")}</Label>
            <Select value={channelId} onValueChange={setChannelId}>
              <SelectTrigger id="channelId" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("alerts.noChannel")}</SelectItem>
                {channels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("alerts.add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
