import { request } from "../http";
import type { SshKey } from "./ssh-keys.type";

// ponytail: paths inlined instead of touching the shared endpoint registry.
const base = (serverId: string) => `/servers/${serverId}/ssh-keys`;

export class SshKeysResource {
  list(serverId: string) {
    return request<{ keys: SshKey[]; count: number }>("GET", base(serverId));
  }
  add(serverId: string, publicKey: string) {
    return request<{ ok: true; output: string }>("POST", base(serverId), {
      body: { publicKey },
    });
  }
  remove(serverId: string, index: number) {
    return request<{ ok: true; output: string }>(
      "DELETE",
      `${base(serverId)}/${index}`,
    );
  }
}
