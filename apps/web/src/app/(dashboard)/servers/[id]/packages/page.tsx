import { PackagesPanel } from "@/components/packages/packages-panel";

export default async function PackagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PackagesPanel serverId={id} />;
}
