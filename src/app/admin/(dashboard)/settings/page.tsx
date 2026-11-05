import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { isEncryptionConfigured } from "@/lib/settings/crypto";
import { resolveEmailLinkBase, resolveMail, resolveResetRules } from "@/lib/settings/store";
import { canOpenSettings } from "@/lib/settings/team";
import NoAccess from "./NoAccess";
import { Card, SourceBadge } from "./ui";

export const dynamic = "force-dynamic";

function Status({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span className="flex items-start gap-2 text-sm text-slate-700">
      <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${ok ? "bg-green-500" : "bg-amber-500"}`} />
      <span>{children}</span>
    </span>
  );
}

export default async function SettingsOverviewPage() {
  const admin = await requireAdmin();
  if (!canOpenSettings(admin.role)) return <NoAccess />;

  const [mail, base, rules, team, history, vendorCount, creatorCount] = await Promise.all([
    resolveMail(),
    resolveEmailLinkBase(),
    resolveResetRules(),
    prisma.adminUser.groupBy({ by: ["active"], _count: true }),
    prisma.settingChange.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.propertyOwnerAccess.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.influencerOwnerAccess.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
  ]);
  const activeAdmins = team.find((t) => t.active)?._count ?? 0;
  const offAdmins = team.find((t) => !t.active)?._count ?? 0;
  const encryptionReady = isEncryptionConfigured();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="E-mail" description="Sends password-reset links and test e-mails.">
        <div className="space-y-2">
          <Status ok={mail.config !== null}>
            {mail.config ? (
              <>
                Sending as <strong>{mail.config.user}</strong>
                <SourceBadge source={mail.sources.user} />
              </>
            ) : (
              <>No Gmail account is set up yet, so no e-mail is sent.</>
            )}
          </Status>
          {mail.unreadable && (
            <Status ok={false}>The saved app password cannot be read (the encryption key changed). Enter it again.</Status>
          )}
        </div>
        <Link href="/admin/settings/email" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
          Open e-mail settings
        </Link>
      </Card>

      <Card title="Site & security" description="The website address used inside e-mails and the password-reset rules.">
        <div className="space-y-2">
          <Status ok={Boolean(base.value)}>
            {base.value ? (
              <>
                Links in e-mails start with <strong>{base.value}</strong>
                <SourceBadge source={base.source} />
              </>
            ) : (
              <>No website address is set, so reset links cannot be made.</>
            )}
          </Status>
          <Status ok>
            Reset links last {rules.linkMinutes} minutes; {rules.requestsPerHour} request(s) per account per hour.
          </Status>
        </div>
        <Link href="/admin/settings/site" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
          Open site & security
        </Link>
      </Card>

      <Card title="Team" description="Who can sign in to this admin area.">
        <Status ok>
          {activeAdmins} active account(s){offAdmins > 0 ? `, ${offAdmins} switched off` : ""}.
        </Status>
        <Link href="/admin/settings/team" className="mt-4 inline-block text-sm font-medium text-slate-900 underline">
          Manage the team
        </Link>
      </Card>

      <Card title="Access & protection" description="A quick health check of the safety settings.">
        <div className="space-y-2">
          <Status ok={encryptionReady}>
            {encryptionReady
              ? "Secrets (the Gmail app password) are encrypted before they are stored."
              : "No encryption key on the server: the app password cannot be saved here until SETTINGS_ENCRYPTION_KEY is added."}
          </Status>
          <Status ok>
            {vendorCount} vendor and {creatorCount} creator sign-in(s) currently allowed.{" "}
            <Link href="/admin/vendors" className="underline">
              Vendors
            </Link>
            {" · "}
            <Link href="/admin/influencers" className="underline">
              Creators
            </Link>
          </Status>
        </div>
      </Card>

      <div className="lg:col-span-2">
        <Card title="Recent changes" description="Who changed what. Values (like passwords) are never recorded here.">
          {history.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing changed yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                  <span className="text-slate-700">
                    <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{h.area}</span>
                    {h.summary}
                  </span>
                  <span className="text-xs text-slate-400">
                    {h.adminEmail} · {h.createdAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
