"use client";

import { memo } from "react";

import type { ServiceActionName, ServiceUnit } from "@/lib/api";

import { TableCell, TableRow } from "@/components/ui/table";

import { ServiceActions } from "./service-actions";
import { ServiceStateBadge } from "./service-state-badge";

export const ServiceRow = memo(function ServiceRow({
  unit,
  busyKey,
  onAction,
  onLogs,
}: {
  unit: ServiceUnit;
  busyKey: string | null;
  onAction: (unit: string, action: ServiceActionName) => void;
  onLogs: (unit: string) => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-xs">{unit.unit}</TableCell>
      <TableCell>
        <ServiceStateBadge active={unit.active} sub={unit.sub} />
      </TableCell>
      <TableCell className="hidden max-w-xs truncate text-xs text-muted-foreground md:table-cell">
        {unit.description}
      </TableCell>
      <TableCell>
        <ServiceActions
          unit={unit.unit}
          busyKey={busyKey}
          onAction={(a) => onAction(unit.unit, a)}
          onLogs={() => onLogs(unit.unit)}
        />
      </TableCell>
    </TableRow>
  );
});
