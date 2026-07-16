// Bump the project version everywhere it appears.
//
//   bun run update 1.0.0
//
// Single source of truth is the root package.json `version`; this script keeps
// the workspaces and the Docker image tags in lockstep with it, so a release
// can never ship a compose file pointing at the previous image.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

const version = process.argv[2];
if (!version) {
  console.error("usage: bun run update <version>   e.g. bun run update 1.0.0");
  process.exit(1);
}
// Semver, optionally with a prerelease (1.0.0-rc.1). Docker tags allow this.
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`invalid version: ${version} (expected semver, e.g. 1.0.0)`);
  process.exit(1);
}

const PACKAGES = [
  "package.json",
  "apps/web/package.json",
  "apps/server/package.json",
  "packages/shared/package.json",
];

for (const rel of PACKAGES) {
  const path = join(ROOT, rel);
  const json = JSON.parse(readFileSync(path, "utf8"));
  const from = json.version;
  json.version = version;
  writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`  ${rel.padEnd(30)} ${from} -> ${version}`);
}

// Image tag defaults. Compose pins an exact version so `docker compose up` on
// an old checkout doesn't silently pull a newer image.
const TAG_FILES = [
  "docker-compose.yml",
  "docker/docker-compose.yml",
  "docker/install.sh",
  "README.md",
];

const TAG_RE = /open-panel:(?:\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?|latest)/g;

for (const rel of TAG_FILES) {
  const path = join(ROOT, rel);
  const before = readFileSync(path, "utf8");
  const after = before.replace(TAG_RE, `open-panel:${version}`);
  if (before === after) {
    console.log(`  ${rel.padEnd(30)} (no image tag found)`);
    continue;
  }
  writeFileSync(path, after);
  const count = before.match(TAG_RE)?.length ?? 0;
  console.log(`  ${rel.padEnd(30)} ${count} tag(s) -> open-panel:${version}`);
}

console.log(`\nBumped to ${version}. Next:\n`);
console.log("  git commit -am \"chore: release v" + version + '"');
console.log("  bun run release");
