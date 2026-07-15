import { DockerManager } from "@/components/docker/docker-manager";

export default async function DockerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DockerManager serverId={id} />;
}
