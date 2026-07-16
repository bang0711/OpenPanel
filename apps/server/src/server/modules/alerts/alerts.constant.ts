export const METRICS = ["cpu", "mem", "disk", "service"] as const;
export type Metric = (typeof METRICS)[number];

export const OPS = [">", "<"] as const;
export type Op = (typeof OPS)[number];

// service targets are unit names / identifiers; keep it shell-safe regardless.
// Capped like every sibling validator — an unbounded string at a trust
// boundary is a free win for nobody.
export const MAX_TARGET = 128;

export function isValidTarget(target: string): boolean {
  return target.length <= MAX_TARGET && /^[a-zA-Z0-9@._-]+$/.test(target);
}
