import { t } from "elysia";

import { BACKUP_ENGINES } from "./db-backup.constant";

export const listQuery = t.Object({
  dir: t.String({ maxLength: 512 }),
});

export const dumpBody = t.Object({
  engine: t.Union(BACKUP_ENGINES.map((e) => t.Literal(e))),
  database: t.String({ maxLength: 64 }),
  dir: t.String({ maxLength: 512 }),
});
