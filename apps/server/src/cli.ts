// Bundled entrypoint (`bun build --target=bun`) for the Docker image.
// Subcommands share one ~7MB JS bundle, run on the image's base bun (no second
// runtime embedded, no node_modules), so the image ships bun once.
//
//   bun server.js          -> start the API + terminal ws (default)
//   bun server.js migrate  -> apply pending DB migrations, then exit
//   bun server.js seed     -> create the first admin user, then exit
//
// Local dev still runs `src/index.ts` directly via `bun run dev`.
export {}; // top-level await requires this file to be a module

const cmd = process.argv[2] ?? "serve";

if (cmd === "migrate") {
  const { runMigrations } = await import("@/db/migrate");
  await runMigrations();
  process.exit(0);
} else if (cmd === "seed") {
  const { seedAdmin } = await import("@/seed");
  await seedAdmin();
  process.exit(0);
} else if (cmd === "serve") {
  // Side-effectful: binds the port and starts the scheduler.
  await import("@/index");
} else {
  console.error(
    `unknown command: ${cmd}\nusage: server.js [serve|migrate|seed]`,
  );
  process.exit(1);
}
