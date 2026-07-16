import { auth } from "@/lib/auth";
import { prisma } from "@/db/prisma";

/**
 * Create the first admin user. Idempotent — safe to run on every deploy.
 * Env: SEED_EMAIL, SEED_PASSWORD, SEED_NAME.
 */
export async function seedAdmin(): Promise<void> {
  const email = process.env.SEED_EMAIL ?? "admin@openpanel.local";
  const password = process.env.SEED_PASSWORD ?? "admin12345";
  const name = process.env.SEED_NAME ?? "Admin";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User already exists: ${email}`);
    return;
  }

  await auth.api.signUpEmail({ body: { email, password, name } });
  await prisma.user.update({ where: { email }, data: { role: "admin" } });

  console.log(`Seeded admin: ${email} (password: ${password})`);
}
