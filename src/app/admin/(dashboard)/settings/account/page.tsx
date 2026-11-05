import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/settings/team";
import { Card } from "../ui";
import AccountForms from "./AccountForms";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const admin = await requireAdmin();
  const sessions = await prisma.adminSession.count({ where: { adminUserId: admin.id, expiresAt: { gt: new Date() } } });

  return (
    <div className="max-w-2xl space-y-4">
      <Card title="My account">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-slate-500">E-mail (used to sign in)</dt>
            <dd className="text-slate-900">{admin.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Role</dt>
            <dd className="text-slate-900">
              {ROLE_LABELS[admin.role]} <span className="text-slate-500">— {ROLE_DESCRIPTIONS[admin.role]}</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Last sign-in</dt>
            <dd className="text-slate-900">
              {admin.lastLoginAt
                ? admin.lastLoginAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Password</dt>
            <dd>
              <Link href="/admin/change-password" className="text-slate-900 underline">
                Change password
              </Link>
            </dd>
          </div>
        </dl>
      </Card>
      <AccountForms name={admin.name} sessions={sessions} />
    </div>
  );
}
