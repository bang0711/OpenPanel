import { t } from "elysia";

export const writeBody = t.Object({
  name: t.String({ maxLength: 128 }),
  content: t.String({ maxLength: 65536 }),
});

export const nameBody = t.Object({
  name: t.String({ maxLength: 128 }),
});
