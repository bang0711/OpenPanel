import { t } from "elysia";

export const addBody = t.Object({
  publicKey: t.String({ minLength: 10, maxLength: 8192 }),
});
