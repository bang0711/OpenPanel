import { prisma } from "@/db/prisma";

export type AuthUser = { id: string; role?: string | null };
export type Action = "read" | "write" | "admin";

const RANK: Record<Action, number> = { read: 1, write: 2, admin: 3 };

type ServerRow = NonNullable<
  Awaited<ReturnType<typeof prisma.server.findUnique>>
>;

export type Gate =
  | { ok: true; server: ServerRow }
  | { ok: false; code: 403 | 404; error: string };

/** Highest action a user may perform on a server, or null if no access. */
async function effectiveLevel(
  server: ServerRow,
  user: AuthUser,
): Promise<Action | null> {
  const readonly = user.role === "readonly";
  if (user.role === "admin") return "admin";
  if (server.ownerId === user.id) return readonly ? "read" : "admin";

  const perm = await prisma.serverPermission.findUnique({
    where: { userId_serverId: { userId: user.id, serverId: server.id } },
  });
  if (!perm) return null;
  const level = (perm.level as Action) ?? "read";
  return readonly && RANK[level] > RANK.read ? "read" : level;
}

/**
 * Central capability gate. Returns the server row when `user` may perform
 * `action` on it, else 403 (has access but not enough) / 404 (no access —
 * existence hidden). Every server-scoped route funnels through this.
 */
export async function authorize(
  serverId: string,
  user: AuthUser,
  action: Action,
): Promise<Gate> {
  const server = await prisma.server.findUnique({ where: { id: serverId } });
  if (!server) return { ok: false, code: 404, error: "Not found" };

  const level = await effectiveLevel(server, user);
  if (level === null) return { ok: false, code: 404, error: "Not found" };
  if (RANK[level] < RANK[action])
    return { ok: false, code: 403, error: "Forbidden" };
  return { ok: true, server };
}

/** Back-compat read gate: the server row the user may read, or null. */
export async function loadOwnedServer(id: string, user: AuthUser) {
  const gate = await authorize(id, user, "read");
  return gate.ok ? gate.server : null;
}
