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
