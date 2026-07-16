"use client";

import { useCallback, useEffect, useState } from "react";
import { RiAddLine, RiDeleteBinLine, RiFileCopyLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type ApiTokenRow, type NewToken } from "@/lib/api";

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

export function TokensManager() {
  const t = useT();
  const [tokens, setTokens] = useState<ApiTokenRow[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // The plaintext token, shown exactly once right after creation.
  const [fresh, setFresh] = useState<NewToken | null>(null);

  const load = useCallback(async () => {
    try {
      setTokens(await api.tokens.list());
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("tokens.loadFailed"),
      );
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name"));
    setSaving(true);
    try {
      const created = await api.tokens.create(name);
      toast.success(t("tokens.created"));
      setAddOpen(false);
      setFresh(created);
      load();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("tokens.createFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm(t("tokens.confirmDelete"))) return;
    try {
      await api.tokens.remove(id);
      toast.success(t("tokens.revoked"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("tokens.revokeFailed"),
      );
    } finally {
      load();
    }
  }

  function copyToken() {
    if (!fresh) return;
    navigator.clipboard.writeText(fresh.token);
    toast.success(t("tokens.copied"));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{t("tokens.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("tokens.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <RiAddLine />
            {t("tokens.create")}
          </Button>
          <RefreshButton onClick={load} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("tokens.colName")}</TableHead>
              <TableHead>{t("tokens.colLastUsed")}</TableHead>
              <TableHead>{t("tokens.colCreated")}</TableHead>
              <TableHead className="text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens?.map((tok) => (
              <TableRow key={tok.id}>
                <TableCell className="font-medium">{tok.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {tok.lastUsedAt
                    ? new Date(tok.lastUsedAt).toLocaleString()
                    : t("tokens.never")}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(tok.createdAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  <IconButton
                    label={t("common.delete")}
                    onClick={() => remove(tok.id)}
                  >
                    <RiDeleteBinLine />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {tokens && tokens.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-xs text-muted-foreground"
                >
                  {t("tokens.empty")}
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
              <DialogTitle>{t("tokens.dialogTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="name">{t("tokens.name")}</Label>
              <Input
                id="name"
                name="name"
                required
                maxLength={64}
                placeholder={t("tokens.namePlaceholder")}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? t("common.saving") : t("tokens.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!fresh} onOpenChange={(o) => !o && setFresh(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{fresh?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">{t("tokens.copyHint")}</p>
          <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
            <code className="flex-1 font-mono text-xs break-all">
              {fresh?.token}
            </code>
            <IconButton label={t("tokens.copy")} onClick={copyToken}>
              <RiFileCopyLine />
            </IconButton>
          </div>
          <DialogFooter>
            <Button onClick={() => setFresh(null)}>{t("tokens.done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
