import { request } from "../http";
import type { NotifChannel } from "./channels.type";

// ponytail: path inlined instead of touching the shared endpoint registry.
const base = "/channels";

export class ChannelsResource {
  list() {
    return request<NotifChannel[]>("GET", base);
  }
  create(name: string, url: string) {
    return request<NotifChannel>("POST", base, { body: { name, url } });
  }
  remove(id: string) {
    return request<{ ok: true }>("DELETE", `${base}/${id}`);
  }
}
