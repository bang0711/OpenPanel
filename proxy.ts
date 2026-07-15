import { type NextRequest,NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Coarse gate only: presence of a session cookie. Real authorization is
// enforced server-side in the Elysia auth plugin (auth.api.getSession).
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Gate pages only. /api/* handles its own auth (401 JSON, not redirect).
  matcher: ["/((?!login|api|_next/static|_next/image|favicon.ico).*)"],
};
