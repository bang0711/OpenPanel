import { QueryConsole } from "@/components/query/query-console";

export default async function QueryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QueryConsole serverId={id} />;
}
