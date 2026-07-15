export type ApiTokenRow = {
  id: string;
  name: string;
  lastUsedAt: string | null;
  createdAt: string;
};

export type NewToken = {
  id: string;
  name: string;
  token: string;
};
