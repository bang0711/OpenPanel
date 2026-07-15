export type AuditEntry = {
  id: string;
  action: string;
  detail: string | null;
  serverId: string | null;
  userEmail: string;
  createdAt: string;
};
