import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const justReset = (await searchParams).reset === "1";

  return (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">ResortInRanchi Admin</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to manage the directory.</p>
      {justReset && (
        <p role="status" className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Your password was changed. Sign in with the new one.
        </p>
      )}
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
