// Compiled entrypoint (`bun build --compile`) for the Docker image.
// Subcommands share one binary so the image ships a single ~95MB executable
// instead of one per task.
//
//   op-server          -> start the API + terminal ws (default)
//   op-server seed     -> create the first admin user, then exit
//
// Local dev still runs `src/index.ts` directly via `bun run dev`.
export {}; // top-level await requires this file to be a module

const cmd = process.argv[2] ?? "serve";

if (cmd === "seed") {
  const { seedAdmin } = await import("@/seed");
  await seedAdmin();
  process.exit(0);
} else if (cmd === "serve") {
  // Side-effectful: binds the port and starts the scheduler.
  await import("@/index");
} else {
  console.error(`unknown command: ${cmd}\nusage: op-server [serve|seed]`);
  process.exit(1);
}
