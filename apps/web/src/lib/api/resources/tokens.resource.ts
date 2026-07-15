import { request } from "../http";
import type { ApiTokenRow, NewToken } from "./tokens.type";

// ponytail: path inlined instead of touching the shared endpoint registry.
const base = "/tokens";

export class TokensResource {
  list() {
    return request<ApiTokenRow[]>("GET", base);
  }
  create(name: string) {
    return request<NewToken>("POST", base, { body: { name } });
  }
  remove(id: string) {
    return request<{ ok: true }>("DELETE", `${base}/${id}`);
  }
}
