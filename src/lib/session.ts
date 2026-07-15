import { headers } from "next/headers";

import { auth } from "@/lib/auth";

/** Session accessor for Server Components / layouts. */
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
