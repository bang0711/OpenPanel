import { FirewallManager } from "@/components/firewall/firewall-manager";

export default async function FirewallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FirewallManager serverId={id} />;
}
