import { BackupsManager } from "@/components/backups/backups-manager";

export default async function BackupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BackupsManager serverId={id} />;
}
