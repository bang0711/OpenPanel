// Allowlists + validation for the services/processes module (injection defense).

export const SERVICE_ACTIONS = [
  "start",
  "stop",
  "restart",
  "enable",
  "disable",
] as const;
export type ServiceAction = (typeof SERVICE_ACTIONS)[number];

export const KILL_SIGNALS = ["TERM", "KILL", "HUP"] as const;
export type KillSignal = (typeof KILL_SIGNALS)[number];

const UNIT_RE = /^[A-Za-z0-9_.@:\\-]+$/;

export function isValidUnit(name: string): boolean {
  return UNIT_RE.test(name) && name.length <= 128;
}
