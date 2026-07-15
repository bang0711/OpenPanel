"use client";

import { useState } from "react";
import { RiBox3Line, RiDownloadLine, RiSearchLine } from "@remixicon/react";
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
import { useT } from "@/components/common/i18n-provider";

export function PackageSearch({ serverId }: { serverId: string }) {
  const t = useT();
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
      toast.error(err instanceof ApiError ? err.message : t("packages.searchFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function install(name: string) {
    setInstalling(name);
    try {
      const r = await api.packages.install(serverId, name);
      setOutput({ title: `install ${name}`, body: r.output });
      if (r.ok) toast.success(t("packages.installed").replace("{name}", name));
      else toast.error(t("packages.installFailedOutput"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("packages.installFailed"));
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSearch} className="flex gap-2">
        <Input
          placeholder={t("packages.searchPlaceholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" size="sm" disabled={loading}>
          <RiSearchLine />
          {loading ? t("packages.searching") : t("common.search")}
        </Button>
      </form>

      {results && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("packages.col.package")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("packages.col.summary")}</TableHead>
                <TableHead className="text-right">{t("common.install")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((r) => (
                <TableRow key={r.name}>
                  <TableCell className="font-mono text-xs">
                    <span className="flex items-center gap-2">
                      <RiBox3Line className="size-3.5 shrink-0 text-muted-foreground" />
                      {r.name}
                    </span>
                  </TableCell>
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
                        {installing === r.name ? t("common.installing") : t("common.install")}
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
                    {t("packages.noResults")}
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
