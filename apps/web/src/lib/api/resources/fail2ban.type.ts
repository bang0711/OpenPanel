export type F2bJail = {
  name: string;
  banned: string[];
};

export type Fail2banStatus = {
  installed: boolean;
  jails: F2bJail[];
};
