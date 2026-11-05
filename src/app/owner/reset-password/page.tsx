import type { Metadata } from "next";
import Link from "next/link";
import { isOwnerResetTokenUsable } from "@/lib/auth/ownerPasswordResetService";
import ResetOwnerPasswordForm from "./ResetOwnerPasswordForm";

// The token is in the address, so keep it out of Referer headers and out of search engines.
export const metadata: Metadata = { title: "Choose a new vendor password", robots: { index: false, follow: false }, referrer: "no-referrer" };

export const dynamic = "force-dynamic";

export default async function OwnerResetPasswordPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const usable = await isOwnerResetTokenUsable(token);

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-center font-serif text-2xl font-semibold text-brand-dark">Choose a new password</h1>
      <div className="mt-8 rounded-lg border border-brand/10 bg-white p-5 shadow-sm">
        {usable ? (
          <ResetOwnerPasswordForm token={token} />
        ) : (
          <>
            <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              This reset link is invalid, already used, or has expired.
            </p>
            <p className="mt-4 text-center text-xs">
              <Link href="/owner/forgot-password" className="text-brand-teal hover:underline">
                Request a new link
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
