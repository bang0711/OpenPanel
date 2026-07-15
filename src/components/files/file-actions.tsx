"use client";

import {
  RiDeleteBinLine,
  RiDownloadLine,
  RiFileEditLine,
  RiPencilLine,
  RiShieldKeyholeLine,
} from "@remixicon/react";

import { api, type FileNode } from "@/lib/api";
import { joinPath } from "@/lib/remote-path";

import { IconButton } from "@/components/common/icon-button";

export function FileActions({
  serverId,
  dir,
  entry,
  onEdit,
  onRename,
  onChmod,
  onDelete,
}: {
  serverId: string;
  dir: string;
  entry: FileNode;
  onEdit: () => void;
  onRename: () => void;
  onChmod: () => void;
  onDelete: () => void;
}) {
  const fullPath = joinPath(dir, entry.name);

  return (
    <div className="flex justify-end gap-1">
      {entry.type !== "dir" && (
        <>
          <IconButton label="Edit" onClick={onEdit}>
            <RiFileEditLine />
          </IconButton>
          <IconButton label="Download" asChild>
            <a href={api.files.downloadUrl(serverId, fullPath)}>
              <RiDownloadLine />
            </a>
          </IconButton>
        </>
      )}
      <IconButton label="Rename" onClick={onRename}>
        <RiPencilLine />
      </IconButton>
      <IconButton label="Permissions" onClick={onChmod}>
        <RiShieldKeyholeLine />
      </IconButton>
      <IconButton label="Delete" onClick={onDelete}>
        <RiDeleteBinLine />
      </IconButton>
    </div>
  );
}
