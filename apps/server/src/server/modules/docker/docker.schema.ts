import { t } from "elysia";

import { DOCKER_ACTIONS } from "./docker.constant";

export const actionBody = t.Object({
  id: t.String({ maxLength: 128 }),
  action: t.Union(DOCKER_ACTIONS.map((a) => t.Literal(a))),
});
