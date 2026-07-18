import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// The backend API origin, resolved at runtime (not baked into the client bundle).
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

/** The interactive API reference + its OpenAPI spec. Served by the backend for
 *  direct/dev access, but never through the public web origin. */
export function isDocsPath(pathname: string): boolean {
  return pathname === "/api/docs" || pathname.startsWith("/api/docs/");
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Don't expose the API docs through the public site: the browser reaching
  // /api/docs would otherwise be proxied straight to the backend's Scalar UI.
  // 404 (not 403) so the site doesn't even admit the path exists.
  if (isDocsPath(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Same-origin proxy: browser calls /api/* (incl. /api/auth/*), we forward it
  // to the backend. Keeps auth cookies first-party and removes any CORS need.
  if (pathname.startsWith("/api/")) {
    return NextResponse.rewrite(new URL(`${API_BASE_URL}${pathname}${search}`));
  }

  // Page gate: coarse presence-of-session-cookie check. Real authorization is
  // enforced by the backend (Elysia auth plugin) on every /api call.
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!api|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
