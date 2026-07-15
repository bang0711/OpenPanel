import { LogsViewer } from "@/components/logs/logs-viewer";

export default async function LogsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LogsViewer serverId={id} />;
}
