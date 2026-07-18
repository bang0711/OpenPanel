// Database-engine abstraction + input validation (injection defense).

export const DB_ENGINES = ["mysql", "postgres"] as const;
export type DbEngine = (typeof DB_ENGINES)[number];

// Identifiers (db/user names): strict allowlist, no shell/SQL metacharacters.
const IDENT_RE = /^[a-zA-Z0-9_]+$/;
// Passwords: printable charset without quotes/backslash/newline, so they can be
// interpolated into SQL delivered over stdin without escaping surprises.
const PASSWORD_RE = /^[A-Za-z0-9!@#%^*_+=.-]{6,128}$/;

export function isValidIdent(s: string): boolean {
  return IDENT_RE.test(s) && s.length <= 64;
}

export function isValidPassword(s: string): boolean {
  return PASSWORD_RE.test(s);
}

// Per-engine command table. Identifiers are always validated before reaching
// here; passwords never touch the command line — they ride inside `sqlShell`
// stdin via `createUserSql`.
export const ENGINE_COMMANDS: Record<
  DbEngine,
  {
    detect: string;
    listDatabases: string;
    createDatabase: (name: string) => string;
    dropDatabase: (name: string) => string;
    // Shell command that reads SQL from stdin (runCommandInput).
    sqlShell: string;
    createUserSql: (username: string, password: string) => string;
    grantSql: (username: string, database: string) => string;
  }
> = {
  // MySQL runs as root (socket auth) — bare, `runPrivileged` escalates to root.
  // Postgres keeps `sudo -u postgres` to BECOME the postgres user (peer auth);
  // that inner user-switch needs root, which `runPrivileged` provides, so from
  // root `sudo -u postgres` runs password-free.
  mysql: {
    detect: "command -v mysql",
    listDatabases: `mysql -N -e "SHOW DATABASES"`,
    // Backticks escaped so the shell treats them literally (mysql identifier quoting).
    createDatabase: (n) => `mysql -e "CREATE DATABASE \\\`${n}\\\`"`,
    dropDatabase: (n) => `mysql -e "DROP DATABASE \\\`${n}\\\`"`,
    sqlShell: "mysql",
    createUserSql: (u, p) =>
      `CREATE USER '${u}'@'localhost' IDENTIFIED BY '${p}';`,
    grantSql: (u, db) =>
      `GRANT ALL PRIVILEGES ON \`${db}\`.* TO '${u}'@'localhost'; FLUSH PRIVILEGES;`,
  },
  postgres: {
    detect: "command -v psql",
    listDatabases: `sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datistemplate=false"`,
    createDatabase: (n) => `sudo -u postgres createdb ${n}`,
    dropDatabase: (n) => `sudo -u postgres dropdb ${n}`,
    sqlShell: "sudo -u postgres psql",
    createUserSql: (u, p) => `CREATE USER ${u} WITH PASSWORD '${p}';`,
    grantSql: (u, db) => `GRANT ALL PRIVILEGES ON DATABASE ${db} TO ${u};`,
  },
};
