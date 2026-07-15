import { request } from "../http";
import type {
  DbBackupEngine,
  DbBackupEngines,
  DbBackupList,
} from "./db-backup.type";

type Result = { ok: boolean; output: string };

export class DbBackupResource {
  engines(serverId: string) {
    return request<DbBackupEngines>(
      "GET",
      `/servers/${serverId}/db-backup`,
    );
  }
  list(serverId: string, dir: string) {
    return request<DbBackupList>("GET", `/servers/${serverId}/db-backup/list`, {
      query: { dir },
    });
  }
  dump(
    serverId: string,
    engine: DbBackupEngine,
    database: string,
    dir: string,
  ) {
    return request<Result>("POST", `/servers/${serverId}/db-backup/dump`, {
      body: { engine, database, dir },
    });
  }
}
