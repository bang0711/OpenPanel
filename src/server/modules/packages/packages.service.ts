import { runCommand, type SshServer } from "@/lib/ssh/client";

import {
  DETECT_CMD,
  isValidPkgName,
  MANAGER_COMMANDS,
  type PkgManager,
} from "./packages.constant";

export type InstalledPackage = { name: string; version: string };
export type SearchResult = { name: string; summary: string };
export type PkgCommandResult = { ok: boolean; output: string };

export class PackagesService {
  async detect(server: SshServer): Promise<PkgManager | null> {
    const { stdout } = await runCommand(server, DETECT_CMD);
    const m = stdout.trim();
    return m === "apt" || m === "dnf" || m === "apk" ? m : null;
  }

  async listInstalled(
    server: SshServer,
  ): Promise<{ manager: PkgManager | null; packages: InstalledPackage[] }> {
    const manager = await this.detect(server);
    if (!manager) return { manager: null, packages: [] };
    const { stdout } = await runCommand(
      server,
      MANAGER_COMMANDS[manager].listInstalled,
    );
    return { manager, packages: this.parseInstalled(manager, stdout) };
  }

  async search(
    server: SshServer,
    q: string,
  ): Promise<{ manager: PkgManager | null; results: SearchResult[] }> {
    if (!isValidPkgName(q)) throw new Error("Invalid search query");
    const manager = await this.detect(server);
    if (!manager) return { manager: null, results: [] };
    const { stdout } = await runCommand(
      server,
      MANAGER_COMMANDS[manager].search(q),
    );
    return { manager, results: this.parseSearch(manager, stdout).slice(0, 60) };
  }

  install(server: SshServer, name: string): Promise<PkgCommandResult> {
    return this.mutate(server, "install", name);
  }

  remove(server: SshServer, name: string): Promise<PkgCommandResult> {
    return this.mutate(server, "remove", name);
  }

  async refresh(server: SshServer): Promise<PkgCommandResult> {
    const manager = await this.detect(server);
    if (!manager) throw new Error("No supported package manager found");
    const { stdout, stderr, code } = await runCommand(
      server,
      MANAGER_COMMANDS[manager].refresh,
    );
    return { ok: code === 0, output: tail(stderr || stdout) };
  }

  private async mutate(
    server: SshServer,
    action: "install" | "remove",
    name: string,
  ): Promise<PkgCommandResult> {
    if (!isValidPkgName(name)) throw new Error("Invalid package name");
    const manager = await this.detect(server);
    if (!manager) throw new Error("No supported package manager found");
    const { stdout, stderr, code } = await runCommand(
      server,
      MANAGER_COMMANDS[manager][action](name),
    );
    return { ok: code === 0, output: tail(stderr || stdout) };
  }

  private parseInstalled(
    manager: PkgManager,
    out: string,
  ): InstalledPackage[] {
    const lines = out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (manager === "apk") {
      return lines.map((l) => {
        const m = l.match(/^(.*?)-(\d[\w.]*(?:-r\d+)?)$/);
        return m ? { name: m[1], version: m[2] } : { name: l, version: "" };
      });
    }
    return lines
      .map((l) => {
        const [name, version = ""] = l.split("\t");
        return { name, version };
      })
      .filter((p) => p.name);
  }

  private parseSearch(manager: PkgManager, out: string): SearchResult[] {
    const lines = out
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (manager === "dnf") {
      return lines
        .filter((l) => l.includes(" : "))
        .map((l) => {
          const idx = l.indexOf(" : ");
          return {
            name: l.slice(0, idx).split(".")[0],
            summary: l.slice(idx + 3),
          };
        });
    }
    // apt and apk: "name[ - summary]"
    return lines.map((l) => {
      const idx = l.indexOf(" - ");
      return idx > 0
        ? { name: l.slice(0, idx), summary: l.slice(idx + 3) }
        : { name: l, summary: "" };
    });
  }
}

// Keep the tail of verbose install/remove output.
function tail(output: string, max = 4000): string {
  const t = output.trim();
  return t.length > max ? t.slice(-max) : t;
}

export const packagesService = new PackagesService();
