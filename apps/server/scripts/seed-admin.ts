// Seed the first admin user. Run: bun run seed  (executes via tsx/Node).
// Override via env: SEED_EMAIL, SEED_PASSWORD, SEED_NAME.
import "dotenv/config";

import { prisma } from "../src/db/prisma";
import { auth } from "../src/lib/auth";

async function main() {
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

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
