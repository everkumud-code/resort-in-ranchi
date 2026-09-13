import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeOwnerAccessToken, OWNER_SESSION_COOKIE_NAME, OWNER_SESSION_DURATION_MS } from "@/lib/auth/ownerAccess";

/**
 * The initial link is exchanged exactly once for a separate owner-session
 * cookie, then immediately redirected to a URL with no credential in it.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/owner?error=missing-token", request.url));
  }

  const exchange = await exchangeOwnerAccessToken(token);
  if (!exchange) {
    return NextResponse.redirect(new URL("/owner?error=invalid-token", request.url));
  }

  const store = await cookies();
  store.set(OWNER_SESSION_COOKIE_NAME, exchange.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: OWNER_SESSION_DURATION_MS / 1000,
    path: "/owner",
  });

  const response = NextResponse.redirect(new URL(`/owner/listing/${exchange.propertyId}`, request.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
