import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

import { prisma } from "@/db/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    // Self-hosted panel: no public sign-up flow; users are provisioned by admins.
  },
  plugins: [admin()],
});
