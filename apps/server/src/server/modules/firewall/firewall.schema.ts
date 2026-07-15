import { t } from "elysia";

import { FW_ACTIONS, FW_PROTOCOLS } from "./firewall.constant";

export const ruleBody = t.Object({
  action: t.Union(FW_ACTIONS.map((a) => t.Literal(a))),
  port: t.Integer({ minimum: 1, maximum: 65535 }),
  protocol: t.Optional(t.Union(FW_PROTOCOLS.map((p) => t.Literal(p)))),
});
