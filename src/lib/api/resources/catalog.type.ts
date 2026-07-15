export type { CatalogApp } from "@/lib/catalog";

export type CatalogStatus = { installed: Record<string, boolean> };
export type CatalogInstallResult = { ok: boolean; output: string };
