import { DbBackupManager } from "@/components/db-backup/db-backup-manager";

export default async function DbBackupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DbBackupManager serverId={id} />;
}
