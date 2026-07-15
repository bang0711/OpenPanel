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

import { DiskUsageCard } from "./disk-usage-card";
import { MetricsToolbar } from "./metrics-toolbar";
import { StatCard } from "./stat-card";

function percent(used: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
}

export function MetricsDashboard({ serverId }: { serverId: string }) {
  const router = useRouter();
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    try {
      setMetrics(await api.metrics.get(serverId));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load metrics");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [serverId]);

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
        result.pinned ? "Connected — host key pinned" : "Connection OK",
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Connection failed");
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
          <AlertTitle>Cannot reach server</AlertTitle>
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
              title="Status"
              value={metrics.systemStatus}
            />
            <StatCard
              icon={<RiRefreshLine className="size-4" />}
              title="Uptime"
              value={formatUptime(metrics.uptimeSeconds)}
            />
            <StatCard
              icon={<RiCpuLine className="size-4" />}
              title="Load (1/5/15m)"
              value={metrics.load.map((l) => l.toFixed(2)).join(" / ")}
              sub={`${metrics.cpuCount} vCPU`}
            />
            <StatCard
              icon={<RiHardDriveLine className="size-4" />}
              title="Memory"
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
