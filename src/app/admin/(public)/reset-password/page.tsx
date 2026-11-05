import type { Metadata } from "next";
import Link from "next/link";
import { isResetTokenUsable } from "@/lib/auth/passwordResetService";
import ResetPasswordForm from "./ResetPasswordForm";

// The token is in the address, so keep it out of Referer headers and out of search engines.
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const raw = (await searchParams).token;
  const token = typeof raw === "string" ? raw : "";
  const usable = await isResetTokenUsable(token);

  return (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Choose a new password</h1>
      {usable ? (
        <div className="mt-6">
          <ResetPasswordForm token={token} />
        </div>
      ) : (
        <>
          <p role="alert" className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            This reset link is invalid, already used, or has expired.
          </p>
          <p className="mt-4 text-center text-xs">
            <Link href="/admin/forgot-password" className="text-slate-600 underline hover:text-slate-900">
              Request a new link
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
