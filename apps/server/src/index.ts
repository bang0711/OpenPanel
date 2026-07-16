import "dotenv/config";

import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import { auth } from "@/lib/auth";
import { app } from "@/server/app";
import { registerJobs } from "@/server/jobs";
import { startScheduler } from "@/server/scheduler";

// Standalone API server (Bun). Hosts the Elysia app (all /api/* module routes)
// plus Better Auth at /api/auth/*, with CORS for the separate web origin.
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";
const port = Number(process.env.PORT ?? 3001);

new Elysia()
  .use(cors({ origin: WEB_ORIGIN, credentials: true }))
  // Better Auth owns its own routing under /api/auth; pass the raw request through.
  .all("/api/auth/*", ({ request }) => auth.handler(request))
  .use(app)
  .listen(port);

// Background jobs (metric sampler, alert poller, backup runner).
registerJobs();
startScheduler();

// eslint-disable-next-line no-console
console.log(`[api] listening on :${port} (cors origin: ${WEB_ORIGIN})`);
