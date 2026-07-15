import { t } from "elysia";

import { AUTH_TYPES } from "./servers.constant";

export const createServerBody = t.Object({
  name: t.String({ minLength: 1 }),
  host: t.String({ minLength: 1 }),
  port: t.Optional(t.Integer({ minimum: 1, maximum: 65535 })),
  username: t.String({ minLength: 1 }),
  authType: t.Union(AUTH_TYPES.map((a) => t.Literal(a))),
  secret: t.String({ minLength: 1 }),
  passphrase: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String({ maxLength: 32 }), { maxItems: 20 })),
});

export type CreateServerBody = typeof createServerBody.static;

export const tagsBody = t.Object({
  tags: t.Array(t.String({ maxLength: 32 }), { maxItems: 20 }),
});
