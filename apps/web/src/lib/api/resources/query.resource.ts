import { request } from "../http";
import type { QueryEngines, QueryResult } from "./query.type";

export class QueryResource {
  engines(serverId: string) {
    return request<QueryEngines>("GET", `/servers/${serverId}/query`);
  }
  run(
    serverId: string,
    engine: "mysql" | "postgres",
    database: string | undefined,
    sql: string,
  ) {
    return request<QueryResult>("POST", `/servers/${serverId}/query`, {
      body: { engine, database, sql },
    });
  }
}
