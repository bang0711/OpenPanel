import { request } from "../http";
import type { DbEngine, DbEngines } from "./db.type";

type Result = { ok: boolean; output: string };

const base = (serverId: string) => `/servers/${serverId}/db`;

export class DbResource {
  engines(serverId: string) {
    return request<DbEngines>("GET", base(serverId));
  }
  databases(serverId: string, engine: DbEngine) {
    return request<string[]>("GET", `${base(serverId)}/databases`, {
      query: { engine },
    });
  }
  createDatabase(serverId: string, engine: DbEngine, name: string) {
    return request<Result>("POST", `${base(serverId)}/database`, {
      body: { engine, name },
    });
  }
  dropDatabase(serverId: string, engine: DbEngine, name: string) {
    return request<Result>("DELETE", `${base(serverId)}/database`, {
      body: { engine, name },
    });
  }
  createUser(
    serverId: string,
    engine: DbEngine,
    username: string,
    password: string,
  ) {
    return request<Result>("POST", `${base(serverId)}/user`, {
      body: { engine, username, password },
    });
  }
  grant(
    serverId: string,
    engine: DbEngine,
    username: string,
    database: string,
  ) {
    return request<Result>("POST", `${base(serverId)}/grant`, {
      body: { engine, username, database },
    });
  }
}
