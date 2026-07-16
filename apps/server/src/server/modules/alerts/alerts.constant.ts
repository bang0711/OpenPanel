export const METRICS = ["cpu", "mem", "disk", "service"] as const;
export type Metric = (typeof METRICS)[number];

export const OPS = [">", "<"] as const;
export type Op = (typeof OPS)[number];

// service targets are unit names / identifiers; keep it shell-safe regardless.
export function isValidTarget(target: string): boolean {
  return /^[a-zA-Z0-9@._-]+$/.test(target);
}
