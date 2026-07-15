import { runCommand, type SshServer } from "@/lib/ssh/client";

import { CATALOG_APPS, findSpec, INSTALL_SPECS } from "./catalog.constant";

export class CatalogService {
  /** One SSH round-trip reporting which catalog apps are already installed. */
  async status(server: SshServer): Promise<Record<string, boolean>> {
    const cmd = CATALOG_APPS.map((a) => {
      const spec = INSTALL_SPECS[a.id];
      return `echo "${a.id}:$(( ${spec.check} ) >/dev/null 2>&1 && echo 1 || echo 0)"`;
    }).join(" ; ");
    const { stdout } = await runCommand(server, cmd);
    const installed: Record<string, boolean> = {};
    for (const line of stdout.split("\n")) {
      const [id, v] = line.trim().split(":");
      if (id) installed[id] = v === "1";
    }
    return installed;
  }

  async install(
    server: SshServer,
    id: string,
  ): Promise<{ ok: boolean; output: string }> {
    const spec = findSpec(id);
    if (!spec) throw new Error("Unknown app");
    const { stdout, stderr, code } = await runCommand(server, spec.install);
    const out = (stderr || stdout).trim();
    return { ok: code === 0, output: out.length > 6000 ? out.slice(-6000) : out };
  }
}

export const catalogService = new CatalogService();
