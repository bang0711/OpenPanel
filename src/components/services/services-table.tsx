"use client";

import type { ServiceActionName,ServiceUnit } from "@/lib/api";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ServiceRow } from "./service-row";

export function ServicesTable({
  units,
  busyKey,
  onAction,
  onLogs,
}: {
  units: ServiceUnit[];
  busyKey: string | null;
  onAction: (unit: string, action: ServiceActionName) => void;
  onLogs: (unit: string) => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unit</TableHead>
            <TableHead>State</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.map((u) => (
            <ServiceRow
              key={u.unit}
              unit={u}
              busyKey={busyKey}
              onAction={onAction}
              onLogs={onLogs}
            />
          ))}
          {units.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-xs text-muted-foreground"
              >
                No services match.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
