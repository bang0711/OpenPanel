export type DbBackupEngine = "mysql" | "postgres";

export type DbBackupEngines = {
  mysql: boolean;
  postgres: boolean;
};

export type DbBackupList = {
  dumps: string[];
};
