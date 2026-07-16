import { UsersManager } from "@/components/users/users-manager";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <UsersManager serverId={id} />;
}
