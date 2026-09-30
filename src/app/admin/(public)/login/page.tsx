import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in" };

export default function AdminLoginPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-panel-green p-6 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">ResortInRanchi Admin</h1>
      <p className="mt-1 text-sm text-slate-500">Sign in to manage the directory.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
