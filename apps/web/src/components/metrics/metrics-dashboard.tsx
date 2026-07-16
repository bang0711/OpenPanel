"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
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

// recharts is ~352K raw / 101K gzip and these charts sit below the fold behind
// a range toggle, but this is the default server tab — so a static import made
// every visit download and parse the whole charting library before first paint.
// Loading it on demand keeps it off the critical path (xterm does the same).
const MetricHistoryCharts = dynamic(
  () => import("./metric-history-charts").then((m) => m.MetricHistoryCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[232px]" />
        ))}
      </div>
    ),
  },
);

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
    // Each tick is a real SSH round-trip to the managed host, so don't poll a
    // tab nobody is looking at; refresh immediately when it comes back.
    const tick = () => {
      if (!document.hidden) load();
    };
    const timer = setInterval(tick, 5000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
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

      <MetricHistoryCharts serverId={serverId} />
    </div>
  );
}
