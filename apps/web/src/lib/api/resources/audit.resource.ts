import { request } from "../http";
import type { AuditEntry } from "./audit.type";

// ponytail: path inlined instead of touching the shared endpoint registry.
const base = "/audit";

export class AuditResource {
  list(limit?: number) {
    return request<AuditEntry[]>("GET", base, { query: { limit } });
  }
}
