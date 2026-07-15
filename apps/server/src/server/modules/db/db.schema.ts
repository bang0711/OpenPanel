import { t } from "elysia";

import { DB_ENGINES } from "./db.constant";

const engine = t.Union(DB_ENGINES.map((e) => t.Literal(e)));

export const engineQuery = t.Object({ engine });

export const createDbBody = t.Object({
  engine,
  name: t.String({ minLength: 1, maxLength: 64 }),
});

export const dropDbBody = t.Object({
  engine,
  name: t.String({ minLength: 1, maxLength: 64 }),
});

export const createUserBody = t.Object({
  engine,
  username: t.String({ minLength: 1, maxLength: 64 }),
  password: t.String({ minLength: 6, maxLength: 128 }),
});

export const grantBody = t.Object({
  engine,
  username: t.String({ minLength: 1, maxLength: 64 }),
  database: t.String({ minLength: 1, maxLength: 64 }),
});
