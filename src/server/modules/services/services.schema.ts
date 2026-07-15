import { t } from "elysia";

import { KILL_SIGNALS,SERVICE_ACTIONS } from "./services.constant";

export const serviceActionBody = t.Object({
  action: t.Union(SERVICE_ACTIONS.map((a) => t.Literal(a))),
});

export const killBody = t.Object({
  signal: t.Union(KILL_SIGNALS.map((s) => t.Literal(s))),
});

export const logsQuery = t.Object({ lines: t.Optional(t.String()) });
