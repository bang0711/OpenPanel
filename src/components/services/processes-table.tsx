"use client";

import type { KillSignalName,ProcessInfo } from "@/lib/api";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useT } from "@/components/common/i18n-provider";

import { ProcessRow } from "./process-row";

export function ProcessesTable({
  procs,
  onKill,
}: {
  procs: ProcessInfo[];
  onKill: (pid: number, signal: KillSignalName) => void;
}) {
  const t = useT();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">{t("services.proc.col.pid")}</TableHead>
            <TableHead>{t("services.proc.col.user")}</TableHead>
            <TableHead className="text-right">
              {t("services.proc.col.cpu")}
            </TableHead>
            <TableHead className="text-right">
              {t("services.proc.col.mem")}
            </TableHead>
            <TableHead>{t("services.proc.col.command")}</TableHead>
            <TableHead className="text-right">
              {t("services.proc.col.kill")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {procs.map((p) => (
            <ProcessRow key={p.pid} proc={p} onKill={onKill} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
