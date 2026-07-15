import { ServicesPanel } from "@/components/services/services-panel";

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ServicesPanel serverId={id} />;
}
