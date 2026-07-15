import { t } from "elysia";

export const grantBody = t.Object({
  email: t.String({ maxLength: 254 }),
  level: t.Union([t.Literal("read"), t.Literal("write"), t.Literal("admin")]),
});
