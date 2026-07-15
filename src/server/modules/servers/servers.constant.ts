export const AUTH_TYPES = ["password", "key"] as const;
export type AuthType = (typeof AUTH_TYPES)[number];

export const DEFAULT_SSH_PORT = 22;
