import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCreatorAccessToken, CREATOR_SESSION_COOKIE_NAME, CREATOR_SESSION_DURATION_MS } from "@/lib/auth/creatorAccess";

/** The initial link is exchanged exactly once for a separate creator-session cookie — mirrors /owner/access exactly. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/creator?error=missing-token", request.url));
  }

  const exchange = await exchangeCreatorAccessToken(token);
  if (!exchange) {
    return NextResponse.redirect(new URL("/creator?error=invalid-token", request.url));
  }

  const store = await cookies();
  store.set(CREATOR_SESSION_COOKIE_NAME, exchange.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: CREATOR_SESSION_DURATION_MS / 1000,
    path: "/creator",
  });

  const response = NextResponse.redirect(new URL("/creator", request.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
