import { t } from "elysia";

export const installBody = t.Object({
  id: t.String({ minLength: 1, maxLength: 64 }),
});
