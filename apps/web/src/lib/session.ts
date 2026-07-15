import { serverFetch } from "@/lib/server-fetch";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role?: string | null;
};
export type Session = { user: SessionUser };

/** Session accessor for Server Components / layouts (via the API server). */
export async function getSession(): Promise<Session | null> {
  const data = await serverFetch<Session>("/api/auth/get-session");
  return data?.user ? data : null;
}
