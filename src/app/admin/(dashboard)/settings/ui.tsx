import type { SettingsFormState } from "./actions";

export const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500";
export const labelClass = "block text-xs font-medium text-slate-600";
export const hintClass = "mt-1 text-xs text-slate-500";
export const primaryButton =
  "rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButton =
  "rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60";
export const dangerButton =
  "rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

export function FormNotice({ state }: { state: SettingsFormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
        {state.success}
      </p>
    );
  }
  return null;
}

export function SourceBadge({ source }: { source: "console" | "environment" | "default" | "none" }) {
  const map = {
    console: ["Saved here", "bg-green-100 text-green-800"],
    environment: ["From the server settings", "bg-sky-100 text-sky-800"],
    default: ["Built-in default", "bg-slate-100 text-slate-600"],
    none: ["Not set", "bg-amber-100 text-amber-800"],
  } as const;
  const [label, tone] = map[source];
  return <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>{label}</span>;
}

export function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-panel-green p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
