import { SshKeysManager } from "@/components/ssh-keys/ssh-keys-manager";

export default async function SshKeysPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SshKeysManager serverId={id} />;
}
