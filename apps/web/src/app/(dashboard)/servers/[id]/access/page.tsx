import { AccessManager } from "@/components/access/access-manager";

export default async function AccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccessManager serverId={id} />;
}
