import { AlertsManager } from "@/components/alerts/alerts-manager";

export default async function AlertsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AlertsManager serverId={id} />;
}
