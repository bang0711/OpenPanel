"use client";

import { useRef } from "react";
import { RiFolderAddLine, RiUploadLine } from "@remixicon/react";

import { Button } from "@/components/ui/button";

import { RefreshButton } from "@/components/common/refresh-button";

export function FileToolbar({
  onNewFolder,
  onUpload,
  onRefresh,
}: {
  onNewFolder: () => void;
  onUpload: (file: File) => void;
  onRefresh: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex gap-1.5">
      <Button size="sm" variant="outline" onClick={onNewFolder}>
        <RiFolderAddLine />
        New folder
      </Button>
      <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
        <RiUploadLine />
        Upload
      </Button>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onUpload(file);
        }}
      />
      <RefreshButton onClick={onRefresh} label="" />
    </div>
  );
}
