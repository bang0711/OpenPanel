import { type NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// The backend API origin, resolved at runtime (not baked into the client bundle).
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

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
