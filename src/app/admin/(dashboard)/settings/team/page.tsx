import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, canOpenSettings, rolesAssignableBy, type TeamRole } from "@/lib/settings/team";
import NoAccess from "../NoAccess";
import { Card } from "../ui";
import AddMemberForm from "./AddMemberForm";
import MemberRow from "./MemberRow";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const admin = await requireAdmin();
  if (!canOpenSettings(admin.role)) return <NoAccess />;

  const [members, sessionCounts] = await Promise.all([
    prisma.adminUser.findMany({ orderBy: [{ active: "desc" }, { createdAt: "asc" }] }),
    prisma.adminSession.groupBy({ by: ["adminUserId"], where: { expiresAt: { gt: new Date() } }, _count: true }),
  ]);
  const sessionsOf = new Map(sessionCounts.map((s) => [s.adminUserId, s._count]));
  const assignable = rolesAssignableBy(admin.role);

  return (
    <div className="space-y-4">
      <Card title="People who can sign in" description="Switch someone off to block them at once without deleting their history.">
        <ul className="divide-y divide-slate-100">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={{
                id: m.id,
                name: m.name,
                email: m.email,
                role: m.role as TeamRole,
                active: m.active,
                lastLogin: m.lastLoginAt ? m.lastLoginAt.toISOString() : null,
                sessions: sessionsOf.get(m.id) ?? 0,
              }}
              isSelf={m.id === admin.id}
              // Admins can only touch Editors; super admins can touch everyone else.
              manageable={m.id !== admin.id && (admin.role === "SUPER_ADMIN" || m.role === "EDITOR")}
              roleOptions={assignable}
            />
          ))}
        </ul>
      </Card>

      <AddMemberForm roles={assignable} />

      <Card title="What each role can do">
        <dl className="space-y-2 text-sm">
          {(["SUPER_ADMIN", "ADMIN", "EDITOR"] as TeamRole[]).map((r) => (
            <div key={r}>
              <dt className="inline font-medium text-slate-900">{ROLE_LABELS[r]}: </dt>
              <dd className="inline text-slate-600">{ROLE_DESCRIPTIONS[r]}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
