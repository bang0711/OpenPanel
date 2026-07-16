import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import { prisma } from "@/db/prisma";

// The browser-facing origin. Auth is reached same-origin at /api/auth/* on the
// web app, which proxies to this server — so the public base URL is the WEB
// origin (:3000), never this server's port (:3001). It scopes the session
// cookie and builds redirect URLs; pointing it at the API port breaks sign-in.
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: WEB_ORIGIN,
  trustedOrigins: [WEB_ORIGIN],
  emailAndPassword: {
    enabled: true,
    // Self-hosted panel: no public sign-up flow; users are provisioned by admins.
  },
  plugins: [admin()],
});
