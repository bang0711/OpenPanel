"use client";

import { useState } from "react";
import { RiUserAddLine } from "@remixicon/react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useT } from "@/components/common/i18n-provider";

export function DbUserDialog({
  serverId,
  engine,
  databases,
}: {
  serverId: string;
  engine: DbEngine;
  databases: string[];
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setSaving(true);
    try {
      await api.db.createUser(serverId, engine, username, password);
      toast.success(t("db.userCreated"));
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("db.actionFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function onGrant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = String(form.get("guser") ?? "").trim();
    const database = String(form.get("gdb") ?? "").trim();
    setSaving(true);
    try {
      await api.db.grant(serverId, engine, username, database);
      toast.success(t("db.grantDone"));
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("db.actionFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <RiUserAddLine />
          {t("db.createUser")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("db.createUser")}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="user">
          <TabsList className="w-full">
            <TabsTrigger value="user" className="flex-1">
              {t("db.createUser")}
            </TabsTrigger>
            <TabsTrigger value="grant" className="flex-1">
              {t("db.grant")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <form onSubmit={onCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username">{t("db.username")}</Label>
                <Input
                  id="username"
                  name="username"
                  required
                  maxLength={64}
                  pattern="[a-zA-Z0-9_]+"
                  placeholder="app_user"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("db.password")}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  maxLength={128}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? t("common.saving") : t("db.createUser")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="grant">
            <form onSubmit={onGrant} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="guser">{t("db.grantUser")}</Label>
                <Input
                  id="guser"
                  name="guser"
                  required
                  maxLength={64}
                  pattern="[a-zA-Z0-9_]+"
                  placeholder="app_user"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gdb">{t("db.grantDb")}</Label>
                <Input
                  id="gdb"
                  name="gdb"
                  required
                  maxLength={64}
                  pattern="[a-zA-Z0-9_]+"
                  list="db-list"
                  placeholder="app_db"
                />
                <datalist id="db-list">
                  {databases.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? t("common.saving") : t("db.grant")}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
