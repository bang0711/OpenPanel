import { headers } from "next/headers";

// Server-Component fetch to the standalone API server, forwarding the caller's
// session cookie. Returns null on any non-2xx (unauthorized, not found, down).
export async function serverFetch<T>(path: string): Promise<T | null> {
  // Server Components can't reach the browser's cookie jar or the same-origin
  // proxy, so we call the backend directly and attach the incoming cookie.
  const base = process.env.API_BASE_URL ?? "http://localhost:3001";
  const cookie = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${base}${path}`, {
    headers: { cookie },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}
