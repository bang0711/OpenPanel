import { t } from "elysia";

export const searchQuery = t.Object({
  q: t.String({ minLength: 1, maxLength: 128 }),
});

export const packageBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 128 }),
});
