export type ServiceUnit = {
  unit: string;
  load: string;
  active: string;
  sub: string;
  description: string;
};

export type ServiceActionName =
  | "start"
  | "stop"
  | "restart"
  | "enable"
  | "disable";

export type ProcessInfo = {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
};

export type KillSignalName = "TERM" | "KILL" | "HUP";

export type CommandResult = { ok: boolean; output: string };
