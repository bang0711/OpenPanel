import { request } from "../http";
import type { DockerActionName, DockerStatus } from "./docker.type";

type Result = { ok: boolean; output: string };

// ponytail: paths inline — endpoint.constant.ts is a shared registry left untouched.
const base = (id: string) => `/servers/${id}/docker`;

export class DockerResource {
  status(serverId: string) {
    return request<DockerStatus>("GET", base(serverId));
  }
  action(serverId: string, id: string, action: DockerActionName) {
    return request<Result>("POST", `${base(serverId)}/action`, {
      body: { id, action },
    });
  }
  removeImage(serverId: string, id: string) {
    return request<Result>(
      "DELETE",
      `${base(serverId)}/image/${encodeURIComponent(id)}`,
    );
  }
  logs(serverId: string, id: string) {
    return request<{ logs: string }>(
      "GET",
      `${base(serverId)}/logs/${encodeURIComponent(id)}`,
    );
  }
}
