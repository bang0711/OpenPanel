"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiAddLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";

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

import { ServerKeyField } from "./server-key-field";

type AuthType = "password" | "key";

export function AddServerDialog() {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authType, setAuthType] = useState<AuthType>("password");
  const [keyText, setKeyText] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.server.create({
        name: String(form.get("name")),
        host: String(form.get("host")),
        port: Number(form.get("port")) || 22,
        username: String(form.get("username")),
        authType,
        secret:
          authType === "password" ? String(form.get("password")) : keyText,
        passphrase: String(form.get("passphrase") || "") || undefined,
      });
      toast.success(t("servers.added"));
      setOpen(false);
      setKeyText("");
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("servers.addFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <RiAddLine />
          {t("common.addServer")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("servers.newServer")}</DialogTitle>
            <DialogDescription>
              {t("servers.encryptedNote")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor="name">{t("common.name")}</Label>
            <Input id="name" name="name" required placeholder="prod-web-1" />
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="host">{t("servers.host")}</Label>
              <Input id="host" name="host" required placeholder="203.0.113.10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="port">{t("servers.port")}</Label>
              <Input
                id="port"
                name="port"
                type="number"
                defaultValue={22}
                className="w-20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="username">{t("servers.username")}</Label>
            <Input id="username" name="username" required placeholder="root" />
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
              <Label htmlFor="password">{t("servers.password")}</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          ) : (
            <>
              <ServerKeyField value={keyText} onChange={setKeyText} />
              <div className="space-y-1.5">
                <Label htmlFor="passphrase">{t("servers.passphraseOptional")}</Label>
                <Input id="passphrase" name="passphrase" type="password" />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.saving") : t("servers.saveServer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
