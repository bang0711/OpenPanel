import { Fail2banManager } from "@/components/fail2ban/fail2ban-manager";

export default async function Fail2banPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Fail2banManager serverId={id} />;
}
