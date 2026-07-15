import { Elysia } from "elysia";

import { hashToken } from "@/lib/api-token";
import { auth } from "@/lib/auth";
import { prisma } from "@/db/prisma";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
};

// Resolve the caller from either a personal API token (Authorization: Bearer)
// or a Better Auth session cookie. Returns a normalized user or null.
async function resolveUser(request: Request): Promise<SessionUser | null> {
  const authz = request.headers.get("authorization");
  if (authz?.startsWith("Bearer ")) {
    const token = authz.slice(7).trim();
    const row = await prisma.apiToken.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!row) return null;
    prisma.apiToken
      .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});
    const user = await prisma.user.findUnique({ where: { id: row.userId } });
    return user
      ? { id: user.id, email: user.email, name: user.name, role: user.role }
      : null;
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const u = session.user;
  return { id: u.id, email: u.email, name: u.name, role: u.role };
}

// Elysia auth macros. Usage: `.get(path, handler, { auth: true })` or `{ admin: true }`.
// The resolved `user` is injected into the handler context and typed.
export const authPlugin = new Elysia({ name: "auth" }).macro({
  auth: {
    resolve: async ({ request, status }) => {
      const user = await resolveUser(request);
      if (!user) return status(401, { error: "Unauthorized" });
      return { user };
    },
  },
  admin: {
    resolve: async ({ request, status }) => {
      const user = await resolveUser(request);
      if (!user) return status(401, { error: "Unauthorized" });
      if (user.role !== "admin") return status(403, { error: "Forbidden" });
      return { user };
    },
  },
});
