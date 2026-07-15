import { DnsManager } from "@/components/dns/dns-manager";

export default async function DnsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DnsManager serverId={id} />;
}
