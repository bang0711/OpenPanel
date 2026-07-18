"use client";

import { RiUploadLine } from "@remixicon/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useT } from "@/components/common/i18n-provider";

/** Private-key input: paste into the textarea or upload a key file. */
export function ServerKeyField({
  value,
  onChange,
  required = true,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  const t = useT();
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(await file.text());
    toast.success(`Loaded ${file.name}`);
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="server-key">{t("servers.privateKey")}</Label>
        <Button asChild size="xs" variant="outline">
          <label className="cursor-pointer">
            <RiUploadLine />
            {t("servers.uploadFile")}
            <input
              type="file"
              className="hidden"
              onChange={onFile}
              accept=".pem,.key,text/plain,application/octet-stream"
            />
          </label>
        </Button>
      </div>
      {/* 70ch = one OpenSSH key line in this mono font. This is the intrinsic
          width the shrink-to-fit dialog sizes itself to, so keys never wrap;
          height follows content via the Textarea's `field-sizing-content`. */}
      <Textarea
        id="server-key"
        required={required}
        rows={5}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-[70ch] max-w-full font-mono text-xs"
        placeholder={t("servers.keyPlaceholder")}
      />
    </div>
  );
}
