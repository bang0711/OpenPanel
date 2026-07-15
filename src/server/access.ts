import { prisma } from "@/db/prisma";

export type AuthUser = { id: string; role?: string | null };

/** Load a server the user may access (owner or admin). Returns full row incl. secrets. */
export async function loadOwnedServer(id: string, user: AuthUser) {
  const server = await prisma.server.findUnique({ where: { id } });
  if (!server) return null;
  if (server.ownerId !== user.id && user.role !== "admin") return null;
  return server;
}
