"use client";

import { memo } from "react";

import type { KillSignalName, ProcessInfo } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";

export const ProcessRow = memo(function ProcessRow({
  proc,
  onKill,
}: {
  proc: ProcessInfo;
  onKill: (pid: number, signal: KillSignalName) => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{proc.pid}</TableCell>
      <TableCell className="text-xs">{proc.user}</TableCell>
      <TableCell className="text-right font-mono text-xs">
        {proc.cpu.toFixed(1)}
      </TableCell>
      <TableCell className="text-right font-mono text-xs">
        {proc.mem.toFixed(1)}
      </TableCell>
      <TableCell className="max-w-xs truncate font-mono text-xs">
        {proc.command}
      </TableCell>
      <TableCell>
        <div className="flex justify-end gap-1">
          <Button
            size="xs"
            variant="outline"
            onClick={() => onKill(proc.pid, "TERM")}
          >
            TERM
          </Button>
          <Button
            size="xs"
            variant="destructive"
            onClick={() => onKill(proc.pid, "KILL")}
          >
            KILL
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});
