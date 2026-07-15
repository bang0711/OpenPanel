import { t } from "elysia";

// Query params arrive as strings; `lines` is parsed to an int in the service.
export const tailQuery = t.Object({
  source: t.String({ maxLength: 32 }),
  lines: t.Optional(t.String()),
  unit: t.Optional(t.String({ maxLength: 128 })),
});
