"use client";

import { memo } from "react";
import { RiFileLine, RiFolderLine } from "@remixicon/react";

import type { FileNode } from "@/lib/api";
import { formatBytes } from "@/lib/format";

import { TableCell, TableRow } from "@/components/ui/table";

import { FileActions } from "./file-actions";

export const FileRow = memo(function FileRow({
  serverId,
  dir,
  entry,
  onOpen,
  onEdit,
  onRename,
  onChmod,
  onDelete,
}: {
  serverId: string;
  dir: string;
  entry: FileNode;
  onOpen: (entry: FileNode) => void;
  onEdit: (entry: FileNode) => void;
  onRename: (entry: FileNode) => void;
  onChmod: (entry: FileNode) => void;
  onDelete: (entry: FileNode) => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <button
          className="flex items-center gap-2 hover:underline"
          onClick={() => onOpen(entry)}
        >
          {entry.type === "dir" ? (
            <RiFolderLine className="size-4 text-primary" />
          ) : (
            <RiFileLine className="size-4 text-muted-foreground" />
          )}
          <span className="font-mono text-xs">{entry.name}</span>
        </button>
      </TableCell>
      <TableCell className="text-right font-mono text-xs text-muted-foreground">
        {entry.type === "dir" ? "—" : formatBytes(entry.size)}
      </TableCell>
      <TableCell className="font-mono text-xs">{entry.mode}</TableCell>
      <TableCell>
        <FileActions
          serverId={serverId}
          dir={dir}
          entry={entry}
          onEdit={() => onEdit(entry)}
          onRename={() => onRename(entry)}
          onChmod={() => onChmod(entry)}
          onDelete={() => onDelete(entry)}
        />
      </TableCell>
    </TableRow>
  );
});
