export type ProxyEntry = {
  name: string;
  serverName: string;
  upstream: string;
  enabled: boolean;
};

export type ProxyStatus = { installed: boolean; proxies: ProxyEntry[] };
