import { DbManager } from "@/components/db/db-manager";

export default async function DbPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DbManager serverId={id} />;
}
