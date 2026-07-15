import { t } from "elysia";

export const createTokenBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 64 }),
});

export type CreateTokenBody = typeof createTokenBody.static;
