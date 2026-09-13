import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

/**
 * Fast, Edge-safe UX redirect for obviously-unauthenticated requests — this
 * only checks whether the session cookie is present, it does NOT verify it
 * against the database (Prisma needs the Node runtime, not Edge). The real
 * authorization check is requireAdmin() in the dashboard layout and in every
 * Server Action; this middleware is a nicety, not the security boundary.
 */
export function middleware(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/((?!login).*)"],
};
