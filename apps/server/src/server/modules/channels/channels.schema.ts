import { t } from "elysia";

export const createChannelBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 64 }),
  url: t.String({ minLength: 1, maxLength: 1024 }),
});

export type CreateChannelBody = typeof createChannelBody.static;
