"use client";

import { useCallback, useEffect, useState } from "react";
import { RiDeleteBinLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type FwStatus } from "@/lib/api";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { IconButton } from "@/components/common/icon-button";
import { RefreshButton } from "@/components/common/refresh-button";

import { AddRuleDialog } from "./add-rule-dialog";

export function FirewallManager({ serverId }: { serverId: string }) {
  const [status, setStatus] = useState<FwStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setStatus(await api.firewall.status(serverId));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load");
    }
  }, [serverId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle() {
    if (!status) return;
    setBusy(true);
    try {
      const r = status.active
        ? await api.firewall.disable(serverId)
        : await api.firewall.enable(serverId);
      if (r.ok) toast.success(status.active ? "Firewall disabled" : "Firewall enabled");
      else toast.error(r.output || "Failed");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    } finally {
      setBusy(false);
      load();
    }
  }

  async function remove(num: number) {
    if (!confirm(`Delete rule ${num}?`)) return;
    try {
      await api.firewall.deleteRule(serverId, num);
      toast.success("Rule deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      load();
    }
  }

  if (status && !status.installed) {
    return (
      <Alert>
        <AlertTitle>ufw not installed</AlertTitle>
        <AlertDescription>
          Install it from the Packages or Catalog tab to manage the firewall.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <Badge variant={status?.active ? "secondary" : "outline"}>
            {status?.active ? "active" : "inactive"}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={status?.active ? "destructive" : "default"}
            onClick={toggle}
            disabled={busy || !status}
          >
            {status?.active ? "Disable" : "Enable"}
          </Button>
          <AddRuleDialog serverId={serverId} onAdded={load} />
          <RefreshButton onClick={load} />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>From</TableHead>
              <TableHead className="text-right">Delete</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {status?.rules.map((r) => (
              <TableRow key={r.num}>
                <TableCell className="font-mono text-xs">{r.num}</TableCell>
                <TableCell className="font-mono text-xs">{r.to}</TableCell>
                <TableCell>
                  <Badge
                    variant={r.action === "ALLOW" ? "secondary" : "outline"}
                  >
                    {r.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {r.from}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <IconButton label="Delete" onClick={() => remove(r.num)}>
                      <RiDeleteBinLine />
                    </IconButton>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {status && status.rules.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-xs text-muted-foreground"
                >
                  No rules.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
