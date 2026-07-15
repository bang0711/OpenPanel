// Central registry of backend endpoint paths (relative to /api).
// All server-scoped routes derive from a single base so paths only change here.

const SERVERS = "/servers";
const server = (id: string) => `${SERVERS}/${id}`;

export const API_ENDPOINT = {
  AUTH: {
    // Handled by Better Auth's own route (/api/auth/*); listed for reference.
    SIGN_IN: "/auth/sign-in/email",
    SIGN_OUT: "/auth/sign-out",
  },
  SERVERS: {
    ROOT: SERVERS,
    BY_ID: server,
    TEST: (id: string) => `${server(id)}/test`,
    TERMINAL_TICKET: (id: string) => `${server(id)}/terminal-ticket`,
  },
  METRICS: {
    ROOT: (id: string) => `${server(id)}/metrics`,
  },
  SERVICES: {
    ROOT: (id: string) => `${server(id)}/services`,
    ACTION: (id: string, unit: string) =>
      `${server(id)}/services/${encodeURIComponent(unit)}/action`,
    LOGS: (id: string, unit: string) =>
      `${server(id)}/services/${encodeURIComponent(unit)}/logs`,
    PROCESSES: (id: string) => `${server(id)}/processes`,
    PROCESS_KILL: (id: string, pid: number) =>
      `${server(id)}/processes/${pid}/kill`,
  },
  PACKAGES: {
    ROOT: (id: string) => `${server(id)}/packages`,
    SEARCH: (id: string) => `${server(id)}/packages/search`,
    INSTALL: (id: string) => `${server(id)}/packages/install`,
    REMOVE: (id: string) => `${server(id)}/packages/remove`,
    REFRESH: (id: string) => `${server(id)}/packages/refresh`,
  },
  CATALOG: {
    ROOT: (id: string) => `${server(id)}/catalog`,
    INSTALL: (id: string) => `${server(id)}/catalog/install`,
  },
  CRON: {
    ROOT: (id: string) => `${server(id)}/cron`,
    BY_INDEX: (id: string, index: number) => `${server(id)}/cron/${index}`,
  },
  FIREWALL: {
    ROOT: (id: string) => `${server(id)}/firewall`,
    RULE: (id: string) => `${server(id)}/firewall/rule`,
    RULE_BY_NUM: (id: string, num: number) =>
      `${server(id)}/firewall/rule/${num}`,
    ENABLE: (id: string) => `${server(id)}/firewall/enable`,
    DISABLE: (id: string) => `${server(id)}/firewall/disable`,
  },
  FILES: {
    ROOT: (id: string) => `${server(id)}/files`,
    CONTENT: (id: string) => `${server(id)}/files/content`,
    MKDIR: (id: string) => `${server(id)}/files/mkdir`,
    CHMOD: (id: string) => `${server(id)}/files/chmod`,
    RENAME: (id: string) => `${server(id)}/files/rename`,
    UPLOAD: (id: string) => `${server(id)}/files/upload`,
    DOWNLOAD: (id: string, path: string) =>
      `${server(id)}/files/download?path=${encodeURIComponent(path)}`,
  },
} as const;
