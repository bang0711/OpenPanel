"use client";

import { useCallback, useEffect, useState } from "react";
import { RiAddLine, RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type NotifChannel } from "@/lib/api";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";
import { RefreshButton } from "@/components/common/refresh-button";

export function ChannelsManager() {
  const t = useT();
  const [channels, setChannels] = useState<NotifChannel[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setChannels(await api.channels.list());
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("channels.loadFailed"),
      );
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await api.channels.create(String(form.get("name")), String(form.get("url")));
      toast.success(t("channels.created"));
      setAddOpen(false);
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("channels.createFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("channels.confirmDelete"))) return;
    try {
      await api.channels.remove(id);
      toast.success(t("channels.removed"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("channels.removeFailed"),
      );
    } finally {
      load();
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("channels.title")}</h1>
          <p className="text-xs text-muted-foreground">
            {t("channels.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <RiAddLine />
            {t("channels.add")}
          </Button>
          <RefreshButton onClick={load} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("channels.colName")}</TableHead>
              <TableHead className="w-24">{t("channels.colType")}</TableHead>
              <TableHead>{t("channels.colUrl")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels?.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {c.type}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground break-all">
                  {c.url}
                </TableCell>
                <TableCell className="text-right">
                  <IconButton
                    label={t("common.delete")}
                    onClick={() => remove(c.id)}
                  >
                    <RiDeleteBinLine />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {channels && channels.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("channels.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={onCreate} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{t("channels.dialogTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("channels.name")}</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={64}
                placeholder={t("channels.namePlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="url">{t("channels.url")}</Label>
              <Input
                id="url"
                name="url"
                required
                type="url"
                pattern="https?://.*"
                maxLength={1024}
                placeholder={t("channels.urlPlaceholder")}
                className="font-mono"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving") : t("channels.add")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
