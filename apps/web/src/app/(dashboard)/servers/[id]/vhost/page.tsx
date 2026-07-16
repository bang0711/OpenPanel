import { VhostManager } from "@/components/vhost/vhost-manager";

export default async function VhostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VhostManager serverId={id} />;
}
