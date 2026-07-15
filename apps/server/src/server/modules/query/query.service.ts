import { runCommand, runCommandInput, type SshServer } from "@/lib/ssh/client";

import { isValidDb, QUERY_ENGINES, type QueryEngine } from "./query.constant";

export type QueryEngines = { mysql: boolean; postgres: boolean };
export type QueryResult = {
  columns: string[];
  rows: string[][];
  raw: string;
  error?: boolean;
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

    const { stdout, stderr, code } = await runCommandInput(server, cmd, sql);

    if (code !== 0 || (!stdout.trim() && stderr.trim())) {
      return {
        columns: [],
        rows: [],
        raw: (stderr || stdout).trim(),
        error: true,
      };
    }
    return this.parse(stdout);
  }

  // Tab-separated output: first line is the header, the rest are rows.
  private parse(out: string): QueryResult {
    const lines = out.replace(/\n+$/, "").split("\n");
    if (lines.length === 0 || lines[0] === "") {
      return { columns: [], rows: [], raw: out };
    }
    const columns = lines[0].split("\t");
    const rows = lines.slice(1).map((l) => l.split("\t"));
    return { columns, rows, raw: out };
  }
}

export const queryService = new QueryService();
