"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RiCpuLine, RiHardDriveLine, RiPulseLine,RiRefreshLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type ServerMetrics } from "@/lib/api";
import { formatBytes, formatUptime } from "@/lib/format";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { useT } from "@/components/common/i18n-provider";

import { DiskUsageCard } from "./disk-usage-card";
import { MetricsToolbar } from "./metrics-toolbar";
import { StatCard } from "./stat-card";

function percent(used: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
}

export function MetricsDashboard({ serverId }: { serverId: string }) {
  const router = useRouter();
  const t = useT();
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    try {
      setMetrics(await api.metrics.get(serverId));
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : t("metrics.loadFailed"),
      );
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [serverId, t]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  async function testConnection() {
    setTesting(true);
    try {
      const result = await api.server.test(serverId);
      toast.success(
        result.pinned
          ? t("metrics.connectionPinned")
          : t("metrics.connectionOk"),
      );
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("metrics.connectionFailed"),
      );
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      <MetricsToolbar
        subtitle={metrics ? `${metrics.hostname} · ${metrics.kernel}` : ""}
        testing={testing}
        onTest={testConnection}
        onRefresh={load}
      />

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t("metrics.cannotReachServer")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !metrics ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : metrics ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<RiPulseLine className="size-4" />}
              title={t("metrics.status")}
              value={metrics.systemStatus}
            />
            <StatCard
              icon={<RiRefreshLine className="size-4" />}
              title={t("metrics.uptime")}
              value={formatUptime(metrics.uptimeSeconds)}
            />
            <StatCard
              icon={<RiCpuLine className="size-4" />}
              title={t("metrics.load")}
              value={metrics.load.map((l) => l.toFixed(2)).join(" / ")}
              sub={`${metrics.cpuCount} ${t("metrics.vcpu")}`}
            />
            <StatCard
              icon={<RiHardDriveLine className="size-4" />}
              title={t("metrics.memory")}
              value={`${formatBytes(metrics.memory.usedBytes)} / ${formatBytes(
                metrics.memory.totalBytes,
              )}`}
            >
              <Progress
                className="mt-2"
                value={percent(
                  metrics.memory.usedBytes,
                  metrics.memory.totalBytes,
                )}
              />
            </StatCard>
          </div>

          <DiskUsageCard disks={metrics.disks} />
        </>
      ) : null}
    </div>
  );
}
