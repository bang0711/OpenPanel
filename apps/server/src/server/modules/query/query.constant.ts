// Query console validation. SQL is arbitrary (fed via stdin, never the command
// line); the engine is allowlisted and the database name is regex-checked before
// it is interpolated into the shell command.

export const QUERY_ENGINES = ["mysql", "postgres"] as const;
export type QueryEngine = (typeof QUERY_ENGINES)[number];

// Database identifiers only — letters, digits, underscore. Empty is allowed
// (connect without selecting a database).
export const DB_IDENT_RE = /^[a-zA-Z0-9_]*$/;

export function isValidDb(database: string): boolean {
  return database.length <= 64 && DB_IDENT_RE.test(database);
}

export type ParsedQuery = { columns: string[]; rows: string[][]; raw: string };

/**
 * Tab-separated output: first line is the header, the rest are rows.
 *
 * `truncated` means the transport cut the output mid-stream, so the final line
 * is almost certainly a partial row — drop it rather than render a row with
 * missing/garbled trailing columns.
 */
export function parseQueryOutput(out: string, truncated = false): ParsedQuery {
  const lines = out.replace(/\n+$/, "").split("\n");
  if (lines.length === 0 || lines[0] === "") {
    return { columns: [], rows: [], raw: out };
  }
  const columns = lines[0].split("\t");
  const body = truncated ? lines.slice(1, -1) : lines.slice(1);
  return { columns, rows: body.map((l) => l.split("\t")), raw: out };
}
