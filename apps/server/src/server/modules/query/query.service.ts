import { runCommand, runCommandInput, type SshServer } from "@/lib/ssh/client";

import {
  isValidDb,
  parseQueryOutput,
  QUERY_ENGINES,
  type QueryEngine,
} from "./query.constant";

export type QueryEngines = { mysql: boolean; postgres: boolean };
export type QueryResult = {
  columns: string[];
  rows: string[][];
  raw: string;
  error?: boolean;
  /** Output hit the transport's byte cap — rows below were discarded. */
  truncated?: boolean;
};

export class QueryService {
  async detect(server: SshServer): Promise<QueryEngines> {
    const { stdout } = await runCommand(
      server,
      "command -v mysql >/dev/null 2>&1 && echo mysql; command -v psql >/dev/null 2>&1 && echo psql",
    );
    return {
      mysql: /(^|\n)mysql(\n|$)/.test(stdout),
      postgres: /(^|\n)psql(\n|$)/.test(stdout),
    };
  }

  async run(
    server: SshServer,
    engine: QueryEngine,
    database: string | undefined,
    sql: string,
  ): Promise<QueryResult> {
    if (!QUERY_ENGINES.includes(engine)) throw new Error("Unsupported engine");
    const db = database ?? "";
    if (!isValidDb(db)) throw new Error("Invalid database name");
    // SQL is delivered via stdin only — reject NUL (can't cross the boundary
    // intact) and cap the size as a second line of defence over the schema.
    if (sql.includes("\0")) throw new Error("SQL contains a NUL byte");
    if (sql.length > 20000) throw new Error("SQL too long");

    const cmd =
      engine === "mysql"
        ? db
          ? `sudo mysql --batch --raw ${db}`
          : "sudo mysql --batch --raw"
        : db
          ? `sudo -u postgres psql -A -F '\\t' -d ${db}`
          : "sudo -u postgres psql -A -F '\\t'";

    const { stdout, stderr, code, truncated } = await runCommandInput(
      server,
      cmd,
      sql,
    );

    if (code !== 0 || (!stdout.trim() && stderr.trim())) {
      return {
        columns: [],
        rows: [],
        raw: (stderr || stdout).trim(),
        error: true,
      };
    }
    return { ...parseQueryOutput(stdout, truncated), truncated };
  }
}

export const queryService = new QueryService();
