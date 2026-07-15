// Server-only install specs, keyed by the shared catalog ids. Metadata
// (names/descriptions) lives in @/lib/catalog and is bundled to the client.
// Install scripts are STATIC (author-defined) — no user-input interpolation.
import { CATALOG_APPS } from "@openpanel/shared";

export { CATALOG_APPS };

export type InstallSpec = {
  check: string; // shell test for "already installed"
  install: string; // shell script to install
};

// Cross-manager package install for the common case.
function pkg(names: { apt: string; dnf: string; apk: string }): string {
  return (
    `if command -v apt-get >/dev/null 2>&1; then apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y ${names.apt}; ` +
    `elif command -v dnf >/dev/null 2>&1; then dnf install -y ${names.dnf}; ` +
    `elif command -v apk >/dev/null 2>&1; then apk add ${names.apk}; ` +
    `else echo "No supported package manager"; exit 1; fi`
  );
}

export const INSTALL_SPECS: Record<string, InstallSpec> = {
  nginx: { check: "command -v nginx", install: pkg({ apt: "nginx", dnf: "nginx", apk: "nginx" }) },
  docker: {
    check: "command -v docker",
    install:
      "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sh /tmp/get-docker.sh",
  },
  postgresql: {
    check: "command -v psql",
    install: pkg({ apt: "postgresql", dnf: "postgresql-server", apk: "postgresql" }),
  },
  redis: {
    check: "command -v redis-server || command -v redis-cli",
    install: pkg({ apt: "redis-server", dnf: "redis", apk: "redis" }),
  },
  nodejs: {
    check: "command -v node",
    install: pkg({ apt: "nodejs npm", dnf: "nodejs npm", apk: "nodejs npm" }),
  },
  git: { check: "command -v git", install: pkg({ apt: "git", dnf: "git", apk: "git" }) },
  htop: { check: "command -v htop", install: pkg({ apt: "htop", dnf: "htop", apk: "htop" }) },
  certbot: {
    check: "command -v certbot",
    install: pkg({ apt: "certbot", dnf: "certbot", apk: "certbot" }),
  },
};

export function findSpec(id: string): InstallSpec | undefined {
  return INSTALL_SPECS[id];
}
