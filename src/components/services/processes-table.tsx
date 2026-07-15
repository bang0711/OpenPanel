"use client";

import type { KillSignalName,ProcessInfo } from "@/lib/api";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ProcessRow } from "./process-row";

export function ProcessesTable({
  procs,
  onKill,
}: {
  procs: ProcessInfo[];
  onKill: (pid: number, signal: KillSignalName) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">PID</TableHead>
            <TableHead>User</TableHead>
            <TableHead className="text-right">CPU%</TableHead>
            <TableHead className="text-right">MEM%</TableHead>
            <TableHead>Command</TableHead>
            <TableHead className="text-right">Kill</TableHead>
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
