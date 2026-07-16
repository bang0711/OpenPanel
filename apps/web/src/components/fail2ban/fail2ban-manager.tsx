"use client";

import { useCallback, useEffect, useState } from "react";
import { RiShieldCheckLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type Fail2banStatus } from "@/lib/api";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";
import { RefreshButton } from "@/components/common/refresh-button";

export function Fail2banManager({ serverId }: { serverId: string }) {
  const t = useT();
  const [status, setStatus] = useState<Fail2banStatus | null>(null);

  const load = useCallback(async () => {
    try {
      setStatus(await api.fail2ban.status(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("fail2ban.loadFailed"));
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const unban = useCallback(
    async (jail: string, ip: string) => {
      if (!confirm(t("fail2ban.confirmUnban").replace("{ip}", ip))) return;
      try {
        const r = await api.fail2ban.unban(serverId, jail, ip);
        if (r.ok) toast.success(t("fail2ban.unbanned"));
        else toast.error(r.output || t("fail2ban.unbanFailed"));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : t("fail2ban.unbanFailed"));
      } finally {
        load();
      }
    },
    [serverId, t, load],
  );

  if (status && !status.installed) {
    return (
      <Alert>
        <AlertTitle>{t("fail2ban.notInstalled")}</AlertTitle>
        <AlertDescription>{t("fail2ban.notInstalledHint")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <RefreshButton onClick={load} />
      </div>

      {status && status.jails.length === 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {t("fail2ban.empty")}
        </p>
      )}

      {status?.jails.map((jail) => (
        <div key={jail.name} className="rounded-md border">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <span className="text-sm font-medium">{t("fail2ban.jail")}</span>
            <span className="font-mono text-xs">{jail.name}</span>
            <Badge variant="outline">
              {t("fail2ban.banned")}: {jail.banned.length}
            </Badge>
          </div>
          <div className="divide-y">
            {jail.banned.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                {t("fail2ban.noBanned")}
              </p>
            )}
            {jail.banned.map((ip) => (
              <div
                key={ip}
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="font-mono text-xs">{ip}</span>
                <IconButton
                  label={t("fail2ban.unban")}
                  onClick={() => unban(jail.name, ip)}
                >
                  <RiShieldCheckLine />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
