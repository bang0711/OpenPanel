import { SslManager } from "@/components/ssl/ssl-manager";

export default async function SslPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SslManager serverId={id} />;
}
