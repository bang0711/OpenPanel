export type { CatalogApp } from "@openpanel/shared";

export type CatalogStatus = { installed: Record<string, boolean> };
export type CatalogInstallResult = { ok: boolean; output: string };
