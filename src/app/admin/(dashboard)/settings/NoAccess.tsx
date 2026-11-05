import Link from "next/link";

export default function NoAccess() {
  return (
    <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">This section is for Admins and Super admins.</p>
      <p className="mt-1">Your role is Editor. You can still change your own name and sign out other devices.</p>
      <Link href="/admin/settings/account" className="mt-3 inline-block font-medium underline">
        Go to My account
      </Link>
    </div>
  );
}
