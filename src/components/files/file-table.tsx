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
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Size</TableHead>
            <TableHead className="w-20">Mode</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                {loading ? "Loading…" : "Empty directory"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
