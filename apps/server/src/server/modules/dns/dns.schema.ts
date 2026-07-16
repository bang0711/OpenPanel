import { t } from "elysia";

export const readQuery = t.Object({
  path: t.String({ maxLength: 512 }),
});

export const writeBody = t.Object({
  path: t.String({ maxLength: 512 }),
  content: t.String({ maxLength: 262144 }),
  zoneName: t.Optional(t.String({ maxLength: 253 })),
});
