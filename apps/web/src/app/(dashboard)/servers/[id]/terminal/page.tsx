import { TerminalView } from "@/components/terminal/terminal-view";

export default async function TerminalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Resolved at runtime and passed down. A NEXT_PUBLIC_* var would be inlined
  // into the client bundle at build time, freezing the URL into the published
  // image so `docker compose` could never override it.
  const wsUrl =
    process.env.TERMINAL_WS_URL ?? "ws://localhost:3001/api/terminal";
  return <TerminalView serverId={id} wsUrl={wsUrl} />;
}
