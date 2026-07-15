"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { api, ApiError, type FileNode } from "@/lib/api";
import { joinPath } from "@/lib/remote-path";

import { TextInputDialog } from "@/components/common/text-input-dialog";

import { FileBreadcrumb } from "./file-breadcrumb";
import { FileEditorDialog } from "./file-editor-dialog";
import { FileTable } from "./file-table";
import { FileToolbar } from "./file-toolbar";

export function FileManager({ serverId }: { serverId: string }) {
  const [path, setPath] = useState("/");
  const [entries, setEntries] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<{ path: string; content: string } | null>(
    null,
  );
  const [renameTarget, setRenameTarget] = useState<FileNode | null>(null);
  const [chmodTarget, setChmodTarget] = useState<FileNode | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);

  const load = useCallback(
    async (target?: string) => {
      setLoading(true);
      try {
        const listing = await api.files.list(serverId, target ?? path);
        setEntries(listing.entries);
        setPath(listing.path);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Failed to list");
      } finally {
        setLoading(false);
      }
    },
    [serverId, path],
  );

  useEffect(() => {
    load("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  // Stable callback so memoized FileRows don't re-render on unrelated state changes.
  const run = useCallback(
    async (fn: () => Promise<unknown>, okMessage: string) => {
      try {
        await fn();
        toast.success(okMessage);
        load();
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Operation failed");
      }
    },
    [load],
  );

  const editEntry = useCallback(
    async (entry: FileNode) => {
      try {
        setEditing(await api.files.read(serverId, joinPath(path, entry.name)));
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Cannot open file");
      }
    },
    [serverId, path],
  );

  const openEntry = useCallback(
    (entry: FileNode) => {
      if (entry.type === "dir") return load(joinPath(path, entry.name));
      return editEntry(entry);
    },
    [load, path, editEntry],
  );

  const deleteEntry = useCallback(
    async (entry: FileNode) => {
      if (!confirm(`Delete ${entry.name}?`)) return;
      await run(
        () => api.files.remove(serverId, joinPath(path, entry.name)),
        `Deleted ${entry.name}`,
      );
    },
    [run, serverId, path],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FileBreadcrumb path={path} onNavigate={load} />
        <FileToolbar
          onNewFolder={() => setNewFolderOpen(true)}
          onUpload={(file) =>
            run(() => api.files.upload(serverId, path, file), `Uploaded ${file.name}`)
          }
          onRefresh={() => load()}
        />
      </div>

      <FileTable
        serverId={serverId}
        dir={path}
        entries={entries}
        loading={loading}
        onOpen={openEntry}
        onEdit={editEntry}
        onRename={setRenameTarget}
        onChmod={setChmodTarget}
        onDelete={deleteEntry}
      />

      <FileEditorDialog
        serverId={serverId}
        file={editing}
        onClose={() => setEditing(null)}
      />

      <TextInputDialog
        open={!!renameTarget}
        title="Rename"
        label="New name"
        initialValue={renameTarget?.name ?? ""}
        submitLabel="Rename"
        mono
        onClose={() => setRenameTarget(null)}
        onSubmit={(name) => {
          if (!renameTarget || !name || name === renameTarget.name)
            return setRenameTarget(null);
          run(
            () =>
              api.files.rename(
                serverId,
                joinPath(path, renameTarget.name),
                joinPath(path, name),
              ),
            `Renamed to ${name}`,
          );
          setRenameTarget(null);
        }}
      />

      <TextInputDialog
        open={!!chmodTarget}
        title="Permissions"
        label="Octal mode"
        placeholder="644"
        initialValue={chmodTarget?.mode ?? ""}
        submitLabel="Apply"
        mono
        onClose={() => setChmodTarget(null)}
        onSubmit={(mode) => {
          if (!chmodTarget) return;
          run(
            () => api.files.chmod(serverId, joinPath(path, chmodTarget.name), mode),
            `Set ${chmodTarget.name} to ${mode}`,
          );
          setChmodTarget(null);
        }}
      />

      <TextInputDialog
        open={newFolderOpen}
        title="New folder"
        label="Name"
        placeholder="my-folder"
        submitLabel="Create"
        onClose={() => setNewFolderOpen(false)}
        onSubmit={(name) => {
          if (name) run(() => api.files.mkdir(serverId, joinPath(path, name)), `Created ${name}`);
          setNewFolderOpen(false);
        }}
      />
    </div>
  );
}
