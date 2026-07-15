import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import { prisma } from "@/db/prisma";

const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL, // public base URL (web origin), e.g. http://localhost:3000
  trustedOrigins: [WEB_ORIGIN], // allow the separate web origin to use auth cross-site
  emailAndPassword: {
    enabled: true,
    // Self-hosted panel: no public sign-up flow; users are provisioned by admins.
  },
  plugins: [admin()],
});
