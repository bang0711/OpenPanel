import { t } from "elysia";

export const unbanBody = t.Object({
  jail: t.String({ maxLength: 64 }),
  ip: t.String({ maxLength: 64 }),
});
