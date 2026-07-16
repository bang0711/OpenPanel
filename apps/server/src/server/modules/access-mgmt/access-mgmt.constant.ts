export const LEVELS = ["read", "write", "admin"] as const;
export type Level = (typeof LEVELS)[number];
