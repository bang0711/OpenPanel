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

import { useT } from "@/components/common/i18n-provider";
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
  const t = useT();
  const fullPath = joinPath(dir, entry.name);

  return (
    <div className="flex justify-end gap-1">
      {entry.type !== "dir" && (
        <>
          <IconButton label={t("common.edit")} onClick={onEdit}>
            <RiFileEditLine />
          </IconButton>
          <IconButton label={t("common.download")} asChild>
            <a href={api.files.downloadUrl(serverId, fullPath)}>
              <RiDownloadLine />
            </a>
          </IconButton>
        </>
      )}
      <IconButton label={t("common.rename")} onClick={onRename}>
        <RiPencilLine />
      </IconButton>
      <IconButton label={t("files.permissions")} onClick={onChmod}>
        <RiShieldKeyholeLine />
      </IconButton>
      <IconButton label={t("common.delete")} onClick={onDelete}>
        <RiDeleteBinLine />
      </IconButton>
    </div>
  );
}
