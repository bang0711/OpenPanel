"use client";

import { useState } from "react";
import { RiRestartLine, RiShutDownLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError } from "@/lib/api";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useT } from "@/components/common/i18n-provider";

export function PowerControls({ serverId }: { serverId: string }) {
  const t = useT();
  const [busy, setBusy] = useState(false);

  async function run(
    action: () => Promise<{ ok: boolean }>,
    confirmKey: string,
  ) {
    if (!confirm(t(confirmKey))) return;
    setBusy(true);
    try {
      const r = await action();
      if (r.ok) toast.success(t("power.issued"));
      else toast.error(t("power.failed"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("power.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Alert variant="destructive">
        <AlertTitle>{t("power.title")}</AlertTitle>
        <AlertDescription>{t("power.warning")}</AlertDescription>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("power.reboot")}</CardTitle>
            <CardDescription>{t("power.confirmReboot")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                run(() => api.power.reboot(serverId), "power.confirmReboot")
              }
            >
              <RiRestartLine />
              {busy ? t("power.rebooting") : t("power.reboot")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("power.shutdown")}</CardTitle>
            <CardDescription>{t("power.confirmShutdown")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() =>
                run(() => api.power.shutdown(serverId), "power.confirmShutdown")
              }
            >
              <RiShutDownLine />
              {busy ? t("power.shuttingDown") : t("power.shutdown")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
