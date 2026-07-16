// Seed the first admin user for local dev: bun run seed
// In Docker this same logic ships inside the compiled binary (`op-server seed`),
// so the image needs no scripts, no node_modules, and no dotenv.
// Override via env: SEED_EMAIL, SEED_PASSWORD, SEED_NAME.
import "dotenv/config";

import { seedAdmin } from "../src/seed";

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
