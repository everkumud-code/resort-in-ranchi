import { requireAdmin } from "@/lib/auth/session";
import { RESET_LINK_MINUTES, RESET_REQUESTS_PER_HOUR } from "@/lib/settings/definitions";
import { resolveEmailLinkBase, resolveResetRules } from "@/lib/settings/store";
import { canOpenSettings } from "@/lib/settings/team";
import { SESSION_DURATION_MS } from "@/lib/auth/constants";
import NoAccess from "../NoAccess";
import { Card } from "../ui";
import SiteForm from "./SiteForm";

export const dynamic = "force-dynamic";

export default async function SiteSettingsPage() {
  const admin = await requireAdmin();
  if (!canOpenSettings(admin.role)) return <NoAccess />;

  const [base, rules] = await Promise.all([resolveEmailLinkBase(), resolveResetRules()]);
  const sessionDays = Math.round(SESSION_DURATION_MS / 86_400_000);

  return (
    <div className="max-w-2xl space-y-4">
      <SiteForm
        siteUrl={base.source === "console" ? (base.value ?? "") : ""}
        effectiveUrl={base.value ?? ""}
        urlSource={base.source}
        linkMinutes={rules.linkMinutes}
        requestsPerHour={rules.requestsPerHour}
        limits={{ minutes: RESET_LINK_MINUTES, perHour: RESET_REQUESTS_PER_HOUR }}
      />
      <Card title="Fixed protections" description="These are built in and are not switched off by any setting.">
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Each reset link works once, and only the newest link works.</li>
          <li>A password reset signs that person out everywhere.</li>
          <li>The answer on the “Forgot password” pages is the same whether or not the e-mail exists.</li>
          <li>Admin sign-ins last {sessionDays} days, then the person must sign in again.</li>
          <li>Links in e-mails always use the address above, never the address the visitor typed.</li>
        </ul>
      </Card>
    </div>
  );
}
