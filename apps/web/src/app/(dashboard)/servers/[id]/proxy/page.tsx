import { ProxyManager } from "@/components/proxy/proxy-manager";

export default async function ProxyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProxyManager serverId={id} />;
}
