export type FwAction = "allow" | "deny";
export type FwProtocol = "tcp" | "udp";

export type FwRule = {
  num: number;
  to: string;
  action: string;
  from: string;
};

export type FwStatus = {
  installed: boolean;
  active: boolean;
  rules: FwRule[];
};
