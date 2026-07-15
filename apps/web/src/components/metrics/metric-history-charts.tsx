"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { api, type MetricHistoryPoint } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { useT } from "@/components/common/i18n-provider";

const RANGES = [
  { hours: 1, key: "metrics.history.range1h" },
  { hours: 24, key: "metrics.history.range24h" },
  { hours: 168, key: "metrics.history.range7d" },
] as const;

function fmtTime(iso: string, hours: number) {
  const d = new Date(iso);
  // ponytail: <=24h shows clock, longer ranges show date; good enough for an axis tick.
  return hours <= 24
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function HistoryChart({
  title,
  data,
  dataKey,
  color,
  hours,
}: {
  title: string;
  data: MetricHistoryPoint[];
  dataKey: keyof MetricHistoryPoint;
  color: string;
  hours: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="createdAt"
              tickFormatter={(v) => fmtTime(v as string, hours)}
              minTickGap={32}
              tick={{ fontSize: 10 }}
            />
            <YAxis tick={{ fontSize: 10 }} width={40} />
            <Tooltip
              labelFormatter={(v) => new Date(v as string).toLocaleString()}
              contentStyle={{ fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function MetricHistoryCharts({ serverId }: { serverId: string }) {
  const t = useT();
  const [hours, setHours] = useState<number>(24);
  const [data, setData] = useState<MetricHistoryPoint[] | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.metrics.history(serverId, hours));
    } catch {
      setData([]);
    }
  }, [serverId, hours]);

  useEffect(() => {
    setData(null);
    load();
  }, [load]);

  const charts = useMemo(
    () => [
      { title: t("metrics.history.cpu"), dataKey: "cpuLoad" as const, color: "var(--chart-1)" },
      { title: t("metrics.history.memory"), dataKey: "memUsedPct" as const, color: "var(--chart-2)" },
      { title: t("metrics.history.disk"), dataKey: "diskUsedPct" as const, color: "var(--chart-3)" },
    ],
    [t],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t("metrics.history.title")}</h3>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <Button
              key={r.hours}
              size="xs"
              variant={hours === r.hours ? "default" : "outline"}
              onClick={() => setHours(r.hours)}
            >
              {t(r.key)}
            </Button>
          ))}
        </div>
      </div>

      {data === null ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[232px]" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("metrics.history.empty")}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {charts.map((c) => (
            <HistoryChart
              key={c.dataKey}
              title={c.title}
              data={data}
              dataKey={c.dataKey}
              color={c.color}
              hours={hours}
            />
          ))}
        </div>
      )}
    </div>
  );
}
