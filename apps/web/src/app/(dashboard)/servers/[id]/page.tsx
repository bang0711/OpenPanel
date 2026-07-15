import { MetricsDashboard } from "@/components/metrics/metrics-dashboard";

export default async function ServerDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MetricsDashboard serverId={id} />;
}
