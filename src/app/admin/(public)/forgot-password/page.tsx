import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">Forgot your password?</h1>
      <p className="mt-1 text-sm text-slate-500">Enter your admin email and we will send you a link to choose a new one.</p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <p className="mt-4 text-center text-xs">
        <Link href="/admin/login" className="text-slate-600 underline hover:text-slate-900">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
