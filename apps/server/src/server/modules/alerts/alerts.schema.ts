import { t } from "elysia";

import { METRICS, OPS } from "./alerts.constant";

export const createBody = t.Object({
  metric: t.Union(METRICS.map((m) => t.Literal(m))),
  op: t.Union(OPS.map((o) => t.Literal(o))),
  threshold: t.Number(),
  target: t.Optional(t.String({ maxLength: 128 })),
  channelId: t.Optional(t.String({ maxLength: 64 })),
});
