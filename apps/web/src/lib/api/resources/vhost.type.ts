export type VhostSite = { name: string; enabled: boolean };

export type VhostStatus = { installed: boolean; sites: VhostSite[] };
