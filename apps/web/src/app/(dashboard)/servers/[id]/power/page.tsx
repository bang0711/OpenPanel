import { PowerControls } from "@/components/power/power-controls";

export default async function PowerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PowerControls serverId={id} />;
}
