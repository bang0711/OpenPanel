import { t } from "elysia";

export const addJobBody = t.Object({
  schedule: t.String({ minLength: 1, maxLength: 120 }),
  command: t.String({ minLength: 1, maxLength: 1000 }),
});
