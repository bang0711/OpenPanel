import { request } from "../http";
import type { BackupJob } from "./backups.type";

const base = (serverId: string) => `/servers/${serverId}/backups`;

type CreateInput = {
  kind: string;
  source: string;
  target: string;
  intervalMins: number;
};

export class BackupsResource {
  list(serverId: string) {
    return request<BackupJob[]>("GET", base(serverId));
  }
  create(serverId: string, body: CreateInput) {
    return request<BackupJob>("POST", base(serverId), { body });
  }
  setEnabled(serverId: string, jobId: string, enabled: boolean) {
    return request<BackupJob>("PATCH", `${base(serverId)}/${jobId}`, {
      body: { enabled },
    });
  }
  runNow(serverId: string, jobId: string) {
    return request<{ ok: boolean; output: string }>(
      "POST",
      `${base(serverId)}/${jobId}/run`,
    );
  }
  remove(serverId: string, jobId: string) {
    return request<BackupJob>("DELETE", `${base(serverId)}/${jobId}`);
  }
}
