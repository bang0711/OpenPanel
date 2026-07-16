import { t } from "elysia";

export const createBody = t.Object({
  name: t.String({ maxLength: 128 }),
  serverName: t.String({ maxLength: 253 }),
  upstreamHost: t.String({ maxLength: 253 }),
  upstreamPort: t.Integer({ minimum: 1, maximum: 65535 }),
});

export const nameBody = t.Object({
  name: t.String({ maxLength: 128 }),
});
