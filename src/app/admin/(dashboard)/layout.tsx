import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";
import AdminHeaderNav from "@/components/admin/AdminHeaderNav";
import JoharSplash from "@/components/site/JoharSplash";

/**
 * No flat text-link nav here on purpose — every section is a colorful block
 * on the dashboard itself (see AdminSectionBlocks). This header just carries
 * the persistent, highlighted "Back" / "Main menu" controls (AdminHeaderNav)
 * so wayfinding works the same from any depth, plus the session controls.
 */
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50">
      <JoharSplash storageKey="johar-splash-admin" subtitle="Admin control centre" buttonLabel="Enter dashboard" />
      <header className="border-b border-slate-200 bg-panel-green">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-900">ResortInRanchi Admin</span>
            <AdminHeaderNav />
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{admin.email}</span>
            <form action={logout}>
              <button type="submit" className="text-slate-500 hover:text-slate-900 hover:underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
