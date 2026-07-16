import { t } from "elysia";

export const runBody = t.Object({
  serverIds: t.Array(t.String(), { maxItems: 100 }),
  action: t.Union([
    t.Literal("uptime"),
    t.Literal("disk"),
    t.Literal("update-packages"),
    t.Literal("service-restart"),
  ]),
  unit: t.Optional(t.String({ maxLength: 128 })),
});

export type RunBody = typeof runBody.static;
