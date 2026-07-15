import { FileManager } from "@/components/files/file-manager";

export default async function FilesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FileManager serverId={id} />;
}
