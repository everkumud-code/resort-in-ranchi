"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { destroyOwnerSessionByToken, OWNER_SESSION_COOKIE_NAME } from "@/lib/auth/ownerAccess";

/** Deletes the session row (not just the cookie) so a copied/leaked cookie value stops working immediately. */
export async function logoutOwner(): Promise<void> {
  const store = await cookies();
  const token = store.get(OWNER_SESSION_COOKIE_NAME)?.value;
  if (token) {
    await destroyOwnerSessionByToken(token);
  }
  store.delete({ name: OWNER_SESSION_COOKIE_NAME, path: "/owner" });
  redirect("/owner");
}
