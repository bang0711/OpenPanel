export const FW_ACTIONS = ["allow", "deny"] as const;
export type FwAction = (typeof FW_ACTIONS)[number];

export const FW_PROTOCOLS = ["tcp", "udp"] as const;
export type FwProtocol = (typeof FW_PROTOCOLS)[number];

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}
