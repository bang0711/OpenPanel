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

import { useT } from "@/components/common/i18n-provider";

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
  const t = useT();
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("services.col.unit")}</TableHead>
            <TableHead>{t("services.col.state")}</TableHead>
            <TableHead className="hidden md:table-cell">
              {t("services.col.description")}
            </TableHead>
            <TableHead className="text-right">{t("common.actions")}</TableHead>
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
                {t("services.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
