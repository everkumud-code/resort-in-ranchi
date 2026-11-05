"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin/settings", label: "Overview", restricted: true },
  { href: "/admin/settings/email", label: "E-mail", restricted: true },
  { href: "/admin/settings/site", label: "Site & security", restricted: true },
  { href: "/admin/settings/team", label: "Team", restricted: true },
  { href: "/admin/settings/account", label: "My account", restricted: false },
];

export default function SettingsTabs({ full }: { full: boolean }) {
  const pathname = usePathname();
  const tabs = TABS.filter((t) => full || !t.restricted);
  return (
    <nav aria-label="Settings sections" className="mt-4 flex flex-wrap gap-1 border-b border-slate-200">
      {tabs.map((tab) => {
        const active = tab.href === "/admin/settings" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px rounded-t-md border-b-2 px-4 py-2 text-sm font-medium ${
              active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
