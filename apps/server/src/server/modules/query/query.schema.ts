import { t } from "elysia";

import { QUERY_ENGINES } from "./query.constant";

export const runBody = t.Object({
  engine: t.Union(QUERY_ENGINES.map((e) => t.Literal(e))),
  database: t.Optional(t.String({ maxLength: 64 })),
  sql: t.String({ minLength: 1, maxLength: 20000 }),
});
