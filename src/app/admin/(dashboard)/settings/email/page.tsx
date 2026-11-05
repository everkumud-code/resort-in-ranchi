import { requireAdmin } from "@/lib/auth/session";
import { isEncryptionConfigured } from "@/lib/settings/crypto";
import { resolveMail } from "@/lib/settings/store";
import { canOpenSettings } from "@/lib/settings/team";
import NoAccess from "../NoAccess";
import { Card } from "../ui";
import EmailForms from "./EmailForms";

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage() {
  const admin = await requireAdmin();
  if (!canOpenSettings(admin.role)) return <NoAccess />;

  const mail = await resolveMail();

  return (
    <div className="max-w-2xl space-y-4">
      <EmailForms
        user={mail.config?.user ?? ""}
        fromName={mail.config?.fromName ?? "ResortInRanchi"}
        hasPassword={mail.sources.appPassword !== "none" && !mail.unreadable}
        passwordSource={mail.unreadable ? "none" : mail.sources.appPassword}
        userSource={mail.sources.user}
        fromNameSource={mail.sources.fromName}
        unreadable={mail.unreadable}
        encryptionReady={isEncryptionConfigured()}
        adminEmail={admin.email}
      />

      <Card title="How to get a Gmail app password">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>
            Sign in to the Gmail account that should send the e-mails and turn on <strong>2-Step Verification</strong> (Google Account &gt;
            Security).
          </li>
          <li>
            Open <strong>myaccount.google.com/apppasswords</strong>, type a name such as “ResortInRanchi website”, and press Create.
          </li>
          <li>Copy the 16-letter code Google shows (spaces do not matter) and paste it above. You can only see it once.</li>
          <li>To change it later: create a new app password, paste it above, and delete the old one in Google.</li>
        </ol>
        <p className="mt-3 text-xs text-slate-500">
          Never share this code in chat or e-mail. It is stored encrypted and is never shown again on this page.
        </p>
      </Card>
    </div>
  );
}
