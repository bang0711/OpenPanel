import { generateToken, hashToken } from "@/lib/api-token";
import { prisma } from "@/db/prisma";

export class TokensService {
  /** List a user's tokens without ever exposing the stored hash. */
  list(userId: string) {
    return prisma.apiToken.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, lastUsedAt: true, createdAt: true },
    });
  }

  /** Create a token; the plaintext is returned once and never stored. */
  async create(userId: string, name: string) {
    const token = generateToken();
    const row = await prisma.apiToken.create({
      data: { userId, name, tokenHash: hashToken(token) },
      select: { id: true, name: true },
    });
    return { token, id: row.id, name: row.name };
  }

  /** Delete a token only if it belongs to the caller. Returns false if not. */
  async remove(userId: string, id: string) {
    const row = await prisma.apiToken.findUnique({ where: { id } });
    if (!row || row.userId !== userId) return false;
    await prisma.apiToken.delete({ where: { id } });
    return true;
  }
}

export const tokensService = new TokensService();
