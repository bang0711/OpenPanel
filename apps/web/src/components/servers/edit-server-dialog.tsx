"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiPencilLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type Server } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";

import { buildServerUpdate } from "./edit-server.constant";
import { ServerKeyField } from "./server-key-field";

type AuthType = "password" | "key";

export function EditServerDialog({ server }: { server: Server }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authType, setAuthType] = useState<AuthType>(server.authType);
  const [keyText, setKeyText] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.server.update(
        server.id,
        buildServerUpdate({
          name: String(form.get("name")),
          host: String(form.get("host")),
          port: Number(form.get("port")) || 22,
          username: String(form.get("username")),
          tags: String(form.get("tags") || ""),
          authType,
          password: String(form.get("password") || ""),
          keyText,
          passphrase: String(form.get("passphrase") || ""),
        }),
      );
      toast.success(t("servers.updated"));
      setOpen(false);
      setKeyText("");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("servers.updateFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <IconButton label={t("common.edit")}>
          <RiPencilLine />
        </IconButton>
      </DialogTrigger>
      <DialogContent className="w-fit min-w-[min(calc(100%-2rem),28rem)] sm:max-w-[calc(100%-2rem)]">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("servers.editServer")}</DialogTitle>
            <DialogDescription>{t("servers.leaveBlankKeep")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name">{t("common.name")}</Label>
            <Input
              id="edit-name"
              name="name"
              required
              defaultValue={server.name}
            />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-host">{t("servers.host")}</Label>
              <Input
                id="edit-host"
                name="host"
                required
                defaultValue={server.host}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-port">{t("servers.port")}</Label>
              <Input
                id="edit-port"
                name="port"
                type="number"
                defaultValue={server.port}
                className="w-20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-username">{t("servers.username")}</Label>
            <Input
              id="edit-username"
              name="username"
              required
              defaultValue={server.username}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-tags">{t("servers.tags")}</Label>
            <Input
              id="edit-tags"
              name="tags"
              defaultValue={server.tags.join(", ")}
              placeholder={t("servers.tagsPlaceholder")}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("servers.authentication")}</Label>
            <Tabs
              value={authType}
              onValueChange={(v) => setAuthType(v as AuthType)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="password" className="flex-1">
                  {t("servers.password")}
                </TabsTrigger>
                <TabsTrigger value="key" className="flex-1">
                  {t("servers.privateKey")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {authType === "password" ? (
            <div className="space-y-1.5">
              <Label htmlFor="edit-password">{t("servers.password")}</Label>
              <Input id="edit-password" name="password" type="password" />
            </div>
          ) : (
            <>
              <ServerKeyField
                value={keyText}
                onChange={setKeyText}
                required={false}
              />
              <div className="space-y-1.5">
                <Label htmlFor="edit-passphrase">
                  {t("servers.passphraseOptional")}
                </Label>
                <Input id="edit-passphrase" name="passphrase" type="password" />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
