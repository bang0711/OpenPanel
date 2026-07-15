import { CronManager } from "@/components/cron/cron-manager";

export default async function CronPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CronManager serverId={id} />;
}
