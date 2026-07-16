import { PortsManager } from "@/components/ports/ports-manager";

export default async function PortsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PortsManager serverId={id} />;
}
