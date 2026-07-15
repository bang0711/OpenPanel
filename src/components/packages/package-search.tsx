"use client";

import { useState } from "react";
import { RiDownloadLine, RiSearchLine } from "@remixicon/react";
import { toast } from "sonner";

import { api, ApiError, type SearchResult } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CommandOutputDialog } from "@/components/common/command-output-dialog";

export function PackageSearch({ serverId }: { serverId: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<string | null>(null);
  const [output, setOutput] = useState<{ title: string; body: string } | null>(
    null,
  );

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q) return;
    setLoading(true);
    try {
      const r = await api.packages.search(serverId, q);
      setResults(r.results);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function install(name: string) {
    setInstalling(name);
    try {
      const r = await api.packages.install(serverId, name);
      setOutput({ title: `install ${name}`, body: r.output });
      if (r.ok) toast.success(`Installed ${name}`);
      else toast.error("Install failed — see output");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Install failed");
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          placeholder="Search packages (e.g. nginx)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" size="sm" disabled={loading}>
          <RiSearchLine />
          {loading ? "Searching…" : "Search"}
        </Button>
      </form>

      {results && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Package</TableHead>
                <TableHead className="hidden md:table-cell">Summary</TableHead>
                <TableHead className="text-right">Install</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-mono text-xs">{r.name}</TableCell>
                  <TableCell className="hidden max-w-md truncate text-xs text-muted-foreground md:table-cell">
                    {r.summary}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={installing === r.name}
                        onClick={() => install(r.name)}
                      >
                        <RiDownloadLine />
                        {installing === r.name ? "Installing…" : "Install"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {results.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-xs text-muted-foreground"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <CommandOutputDialog
        title={output?.title ?? null}
        output={output?.body ?? ""}
        onClose={() => setOutput(null)}
      />
    </div>
  );
}
