"use client";

import { RiUploadLine } from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/** Private-key input: paste into the textarea or upload a key file. */
export function ServerKeyField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(await file.text());
    toast.success(`Loaded ${file.name}`);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="server-key">Private key</Label>
        <Button asChild size="xs" variant="outline">
          <label className="cursor-pointer">
            <RiUploadLine />
            Upload file
            <input
              type="file"
              className="hidden"
              onChange={onFile}
              accept=".pem,.key,text/plain,application/octet-stream"
            />
          </label>
        </Button>
      </div>
      <Textarea
        id="server-key"
        required
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs"
        placeholder="-----BEGIN OPENSSH PRIVATE KEY----- (paste or upload)"
      />
    </div>
  );
}
