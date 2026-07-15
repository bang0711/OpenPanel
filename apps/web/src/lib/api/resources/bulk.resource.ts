import { request } from "../http";
import type { BulkRun } from "./bulk.type";

// ponytail: path inline — /bulk is dashboard-level, not server-scoped, so it
// has no entry in endpoint.constant.ts (those derive from the server base).
export class BulkResource {
  run(serverIds: string[], action: string, unit?: string) {
    return request<BulkRun>("POST", "/bulk/run", {
      body: { serverIds, action, unit },
    });
  }
}
