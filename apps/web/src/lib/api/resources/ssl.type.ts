export type SslCert = {
  name: string;
  domains: string[];
  expiry: string;
  valid: boolean;
};

export type SslStatus = {
  installed: boolean;
  certs: SslCert[];
};
