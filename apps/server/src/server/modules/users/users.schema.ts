import { t } from "elysia";

export const createBody = t.Object({
  username: t.String({ maxLength: 32 }),
  shell: t.Optional(t.String({ maxLength: 64 })),
});

export const sudoBody = t.Object({
  username: t.String({ maxLength: 32 }),
  enable: t.Boolean(),
});
