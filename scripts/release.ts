// Build and push the Docker image for the current version.
//
//   DOCKER_REPO=youruser/open-panel bun run release
//
// Order is deliberate: gates first, then build, then push. Nothing reaches
// Docker Hub unless typecheck + lint + tests + the image build all pass.
import { $ } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const { version } = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8"),
) as { version: string };

const repo = process.env.DOCKER_REPO;
if (!repo) {
  console.error(
    "error: DOCKER_REPO is not set.\n" +
      "  DOCKER_REPO=youruser/open-panel bun run release",
  );
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");

$.cwd(ROOT);
$.throws(true);

// A dirty tree means the image would not match any commit — untraceable later.
const status = (await $`git status --porcelain`.text()).trim();
if (status && !dryRun) {
  console.error("error: working tree is dirty. Commit before releasing:\n");
  console.error(status);
  process.exit(1);
}

console.log(`\n=> releasing ${repo}:${version}\n`);

console.log("=> gates (typecheck, lint, tests)");
await $`bun run test`;

console.log("\n=> docker build");
await $`docker build -t ${`${repo}:${version}`} -t ${`${repo}:latest`} ${ROOT}`;

if (dryRun) {
  console.log(`\n--dry-run: built ${repo}:${version}, not pushing.`);
  process.exit(0);
}

console.log("\n=> docker push");
await $`docker push ${`${repo}:${version}`}`;
await $`docker push ${`${repo}:latest`}`;

console.log(`\n=> tagging v${version}`);
await $`git tag -a ${`v${version}`} -m ${`Release v${version}`}`;

console.log(`
Released ${repo}:${version}

  git push origin v${version}     # push the tag

Users install with:
  docker run --rm -v "\$PWD:/output" ${repo}:${version} install
  docker compose up -d
`);
