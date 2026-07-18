"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type Server } from "@/lib/api";

import { useT } from "@/components/common/i18n-provider";
import { IconButton } from "@/components/common/icon-button";

import { EditServerDialog } from "./edit-server-dialog";

export function ServerHeaderActions({ server }: { server: Server }) {
  const t = useT();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm(t("servers.confirmDelete"))) return;
    setDeleting(true);
    try {
      await api.server.remove(server.id);
      toast.success(t("servers.removed"));
      router.push("/servers");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("servers.removeFailed"),
      );
      setDeleting(false);
    }
  }

  return (
    <div className="ml-auto flex items-center gap-1">
      <EditServerDialog server={server} />
      <IconButton
        label={t("common.delete")}
        onClick={onDelete}
        disabled={deleting}
        className="text-muted-foreground hover:text-destructive"
      >
        <RiDeleteBinLine />
      </IconButton>
    </div>
  );
}
