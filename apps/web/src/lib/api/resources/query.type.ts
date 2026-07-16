export type QueryEngines = { mysql: boolean; postgres: boolean };

export type QueryResult = {
  columns: string[];
  rows: string[][];
  raw: string;
  error?: boolean;
  /** Output hit the transport's byte cap — rows below were discarded. */
  truncated?: boolean;
};
