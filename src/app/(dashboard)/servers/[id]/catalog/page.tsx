import { AppCatalog } from "@/components/catalog/app-catalog";

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AppCatalog serverId={id} />;
}
