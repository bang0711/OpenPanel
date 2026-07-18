import {
  runCommand,
  runPrivileged,
  runPrivilegedInput,
  type SshServer,
} from "@/lib/ssh/client";

import {
  DB_ENGINES,
  type DbEngine,
  ENGINE_COMMANDS,
  isValidIdent,
  isValidPassword,
} from "./db.constant";

export type DbEngines = { mysql: boolean; postgres: boolean };
export type DbCommandResult = { ok: boolean; output: string };

export class DbService {
  async detect(server: SshServer): Promise<DbEngines> {
    const { stdout } = await runCommand(
      server,
      "command -v mysql >/dev/null 2>&1 && echo mysql; " +
        "command -v psql >/dev/null 2>&1 && echo psql",
    );
    return { mysql: /\bmysql\b/.test(stdout), postgres: /\bpsql\b/.test(stdout) };
  }

  async listDatabases(server: SshServer, engine: DbEngine): Promise<string[]> {
    this.assertEngine(engine);
    const { stdout } = await runPrivileged(
      server,
      ENGINE_COMMANDS[engine].listDatabases,
    );
    return stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }

  createDatabase(
    server: SshServer,
    engine: DbEngine,
    name: string,
  ): Promise<DbCommandResult> {
    this.assertEngine(engine);
    if (!isValidIdent(name)) throw new Error("Invalid database name");
    return this.run(server, ENGINE_COMMANDS[engine].createDatabase(name));
  }

  dropDatabase(
    server: SshServer,
    engine: DbEngine,
    name: string,
  ): Promise<DbCommandResult> {
    this.assertEngine(engine);
    if (!isValidIdent(name)) throw new Error("Invalid database name");
    return this.run(server, ENGINE_COMMANDS[engine].dropDatabase(name));
  }

  createUser(
    server: SshServer,
    engine: DbEngine,
    username: string,
    password: string,
  ): Promise<DbCommandResult> {
    this.assertEngine(engine);
    if (!isValidIdent(username)) throw new Error("Invalid username");
    if (!isValidPassword(password)) throw new Error("Invalid password");
    const cmd = ENGINE_COMMANDS[engine];
    return this.runInput(
      server,
      cmd.sqlShell,
      cmd.createUserSql(username, password),
    );
  }

  grant(
    server: SshServer,
    engine: DbEngine,
    username: string,
    database: string,
  ): Promise<DbCommandResult> {
    this.assertEngine(engine);
    if (!isValidIdent(username)) throw new Error("Invalid username");
    if (!isValidIdent(database)) throw new Error("Invalid database name");
    const cmd = ENGINE_COMMANDS[engine];
    return this.runInput(
      server,
      cmd.sqlShell,
      cmd.grantSql(username, database),
    );
  }

  private assertEngine(engine: DbEngine): void {
    if (!DB_ENGINES.includes(engine)) throw new Error("Invalid engine");
  }

  private async run(
    server: SshServer,
    cmd: string,
  ): Promise<DbCommandResult> {
    const { stdout, stderr, code } = await runPrivileged(server, cmd);
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }

  private async runInput(
    server: SshServer,
    cmd: string,
    input: string,
  ): Promise<DbCommandResult> {
    const { stdout, stderr, code } = await runPrivilegedInput(
      server,
      cmd,
      input,
    );
    return { ok: code === 0, output: (stderr || stdout).trim() };
  }
}

export const dbService = new DbService();
