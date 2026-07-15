export type BulkResult = {
  serverId: string;
  name?: string;
  ok: boolean;
  output: string;
};

export type BulkRun = { results: BulkResult[] };
