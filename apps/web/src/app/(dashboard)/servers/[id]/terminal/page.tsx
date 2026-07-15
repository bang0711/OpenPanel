import { TerminalView } from "@/components/terminal/terminal-view";

export default async function TerminalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TerminalView serverId={id} />;
}
