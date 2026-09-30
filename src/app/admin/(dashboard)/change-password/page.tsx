import { requireAdmin } from "@/lib/auth/session";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  const admin = await requireAdmin();

  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-slate-900">Change password</h1>
      <p className="mt-1 text-sm text-slate-600">Signed in as {admin.email}</p>
      <ChangePasswordForm />
    </div>
  );
}
