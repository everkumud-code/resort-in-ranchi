import type { Metadata } from "next";
import Link from "next/link";
import ForgotOwnerPasswordForm from "./ForgotOwnerPasswordForm";

export const metadata: Metadata = { title: "Forgot your vendor password", robots: { index: false, follow: false } };

export default function OwnerForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-center font-serif text-2xl font-semibold text-brand-dark">Forgot your password?</h1>
      <p className="mt-3 text-center text-sm text-brand/70">
        Enter the email you set up for your vendor login and we will send you a link to choose a new password.
      </p>
      <div className="mt-8 rounded-lg border border-brand/10 bg-white p-5 shadow-sm">
        <ForgotOwnerPasswordForm />
      </div>
      <p className="mt-6 text-center text-xs text-brand/60">
        Never set up a password? Your one-time access link is the way in:{" "}
        <Link href="/contact" className="text-brand-teal hover:underline">
          contact us
        </Link>{" "}
        if it has expired.
      </p>
      <p className="mt-3 text-center text-xs">
        <Link href="/owner" className="text-brand-teal hover:underline">
          Back to vendor login
        </Link>
      </p>
    </div>
  );
}
