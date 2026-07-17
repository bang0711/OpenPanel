// Cut a release: gate, tag, push the tag. CI does the rest.
//
//   bun run release
//
// Pushing the tag is the release — it triggers .github/workflows/release.yml,
// which re-runs the gates, builds the image, pushes it to Docker Hub, and
// deploys to the server. This script deliberately does NOT build or push the
// image: doing it here would publish the same version twice (once from a
// laptop, once from CI) and tie releases to whatever Docker happens to be
// installed locally. The runner builds it, from a clean checkout, every time.
import { $ } from "bun";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const { version } = JSON.parse(
  readFileSync(join(ROOT, "package.json"), "utf8"),
) as { version: string };

const dryRun = process.argv.includes("--dry-run");
const tag = `v${version}`;

$.cwd(ROOT);
$.throws(true);

// A dirty tree means the tag would not describe what actually ships.
const status = (await $`git status --porcelain`.text()).trim();
if (status && !dryRun) {
  console.error("error: working tree is dirty. Commit before releasing:\n");
  console.error(status);
  process.exit(1);
}

// Fail here rather than after the gates: `git tag` would reject it anyway, and
// a re-release needs a new version, not a moved tag. Moving a published tag
// would leave the pushed image and the tag disagreeing about what v<x> is.
const exists = (await $`git tag -l ${tag}`.text()).trim();
if (exists) {
  console.error(
    `error: ${tag} already exists.\n` +
      `  bun run update <next-version>   # releases are immutable; bump instead`,
  );
  process.exit(1);
}

console.log(`\n=> releasing ${tag}\n`);

// CI re-runs these, but failing here costs seconds and avoids a tag that has
// to be deleted from the remote after a red build.
console.log("=> gates (typecheck, lint, tests)");
await $`bun run test`;

if (dryRun) {
  console.log(`\n--dry-run: gates passed, ${tag} not created.`);
  process.exit(0);
}

console.log(`\n=> tagging ${tag}`);
await $`git tag -a ${tag} -m ${`Release ${tag}`}`;

console.log(`=> pushing ${tag}`);
await $`git push origin ${tag}`;

console.log(`
Pushed ${tag}. CI now gates, publishes the image, and deploys:

  https://github.com/bang0711/OpenPanel/actions

Once it is green, users install with:
  docker run --rm -v "\$PWD:/output" <repo>:${version} install
  docker compose up -d
`);
