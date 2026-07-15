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
});

export type CreateServerBody = typeof createServerBody.static;
