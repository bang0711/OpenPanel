"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useT } from "@/components/common/i18n-provider";

/** Scrollable monospace dialog for command output (installs, logs, etc.). */
export function CommandOutputDialog({
  title,
  output,
  onClose,
}: {
  title: string | null;
  output: string;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <Dialog open={!!title} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-96 rounded-md border bg-muted/30 p-3">
          <pre className="font-mono text-[0.7rem] leading-relaxed whitespace-pre-wrap">
            {output || t("common.noOutput")}
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
