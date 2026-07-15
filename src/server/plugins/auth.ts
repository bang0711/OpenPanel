import { Elysia } from "elysia";

import { auth } from "@/lib/auth";

// Elysia auth macros. Usage: `.get(path, handler, { auth: true })` or `{ admin: true }`.
// The resolved `user` is injected into the handler context and typed.
export const authPlugin = new Elysia({ name: "auth" }).macro({
  auth: {
    resolve: async ({ request, status }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { error: "Unauthorized" });
      return { user: session.user };
    },
  },
  admin: {
    resolve: async ({ request, status }) => {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) return status(401, { error: "Unauthorized" });
      if (session.user.role !== "admin")
        return status(403, { error: "Forbidden" });
      return { user: session.user };
    },
  },
});
