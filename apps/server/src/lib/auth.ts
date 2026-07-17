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
  advanced: {
    ipAddress: {
      // The backend always sits behind the same-origin proxy (proxy.ts rewrites
      // /api/* to here), which forwards the real client IP as X-Forwarded-For.
      // Without this, Better Auth can't resolve an IP and rate-limits every
      // request into one shared bucket. Trusting the header is safe only because
      // the proxy sets it; a client that reaches :3001 directly could spoof it,
      // which at worst lets them evade the per-IP auth rate limit — the reason
      // sign-up is closed and users are admin-provisioned.
      ipAddressHeaders: ["x-forwarded-for"],
    },
  },
  plugins: [admin()],
});
