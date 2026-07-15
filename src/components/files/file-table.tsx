"use client";

import type { FileNode } from "@/lib/api";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useT } from "@/components/common/i18n-provider";

import { FileRow } from "./file-row";

export function FileTable({
  serverId,
  dir,
  entries,
  loading,
  onOpen,
  onEdit,
  onRename,
  onChmod,
  onDelete,
}: {
  serverId: string;
  dir: string;
  entries: FileNode[];
  loading: boolean;
  onOpen: (entry: FileNode) => void;
  onEdit: (entry: FileNode) => void;
  onRename: (entry: FileNode) => void;
  onChmod: (entry: FileNode) => void;
  onDelete: (entry: FileNode) => void;
}) {
  const t = useT();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead className="text-right">{t("files.size")}</TableHead>
            <TableHead className="w-20">{t("files.mode")}</TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((e) => (
            <FileRow
              key={e.name}
              serverId={serverId}
              dir={dir}
              entry={e}
              onOpen={onOpen}
              onEdit={onEdit}
              onRename={onRename}
              onChmod={onChmod}
              onDelete={onDelete}
            />
          ))}
          {entries.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-xs text-muted-foreground"
              >
                {loading ? t("common.loading") : t("files.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
