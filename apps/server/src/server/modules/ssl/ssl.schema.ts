import { t } from "elysia";

export const issueBody = t.Object({
  domain: t.String({ maxLength: 253 }),
  email: t.String({ maxLength: 254 }),
});
