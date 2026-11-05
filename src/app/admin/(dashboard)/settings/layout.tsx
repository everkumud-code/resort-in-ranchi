import { requireAdmin } from "@/lib/auth/session";
import { canOpenSettings } from "@/lib/settings/team";
import SettingsTabs from "./SettingsTabs";

/** Wraps every Settings page with the section tabs. Editors only see "My account". */
export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div>
      <h1 className="font-serif text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-600">Everything that runs the site behind the scenes, in one place.</p>
      <SettingsTabs full={canOpenSettings(admin.role)} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
