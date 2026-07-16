import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// Prisma 7 (query compiler) needs either a driver adapter (direct Postgres) or
// an Accelerate URL — never both. `prisma+postgres://` means Accelerate.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  (connectionString.startsWith("prisma+postgres://")
    ? new PrismaClient({ accelerateUrl: connectionString })
    : new PrismaClient({ adapter: new PrismaPg({ connectionString }) }));

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
