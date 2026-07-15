export type PkgManager = "apt" | "dnf" | "apk";

export type InstalledPackage = { name: string; version: string };
export type SearchResult = { name: string; summary: string };

export type PackageList = {
  manager: PkgManager | null;
  packages: InstalledPackage[];
};
export type PackageSearch = {
  manager: PkgManager | null;
  results: SearchResult[];
};
export type PkgCommandResult = { ok: boolean; output: string };
