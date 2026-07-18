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

// Every field optional: an edit may touch only some of them. secret/passphrase
// left out keep the stored credentials (never overwritten with an empty value).
export const updateServerBody = t.Object({
  name: t.Optional(t.String({ minLength: 1 })),
  host: t.Optional(t.String({ minLength: 1 })),
  port: t.Optional(t.Integer({ minimum: 1, maximum: 65535 })),
  username: t.Optional(t.String({ minLength: 1 })),
  authType: t.Optional(t.Union(AUTH_TYPES.map((a) => t.Literal(a)))),
  secret: t.Optional(t.String({ minLength: 1 })),
  passphrase: t.Optional(t.String()),
  tags: t.Optional(t.Array(t.String({ maxLength: 32 }), { maxItems: 20 })),
});

export type UpdateServerBody = typeof updateServerBody.static;

export const tagsBody = t.Object({
  tags: t.Array(t.String({ maxLength: 32 }), { maxItems: 20 }),
});
