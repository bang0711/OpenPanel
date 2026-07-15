import { t } from "elysia";

export const createBody = t.Object({
  kind: t.Union([t.Literal("files"), t.Literal("db")]),
  source: t.String({ maxLength: 512 }),
  target: t.String({ maxLength: 512 }),
  intervalMins: t.Integer({ minimum: 5, maximum: 100000 }),
});

export const toggleBody = t.Object({ enabled: t.Boolean() });
