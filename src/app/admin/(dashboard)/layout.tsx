import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/lib/auth/actions";
import { prisma } from "@/lib/prisma";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/properties", label: "Properties" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/enquiries", label: "Enquiries" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/data-quality", label: "Data Quality" },
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [pendingClaimCount, pendingSubmissionCount, newEnquiryCount] = await Promise.all([
    prisma.claimRequest.count({ where: { status: "PENDING" } }),
    prisma.propertySubmission.count({ where: { status: "PENDING" } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-slate-900">ResortInRanchi Admin</span>
            <nav className="flex gap-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-slate-600 hover:text-slate-900 hover:underline"
                >
                  {item.label}
                  {item.href === "/admin/claims" && pendingClaimCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                      {pendingClaimCount}
                    </span>
                  )}
                  {item.href === "/admin/submissions" && pendingSubmissionCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                      {pendingSubmissionCount}
                    </span>
                  )}
                  {item.href === "/admin/enquiries" && newEnquiryCount > 0 && (
                    <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800">
                      {newEnquiryCount}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
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
