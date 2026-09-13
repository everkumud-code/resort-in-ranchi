export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-brand-olive/40 bg-brand-olive/5 p-8 text-center">
      <p className="font-medium text-brand-dark">{title}</p>
      <p className="mt-1 text-sm text-brand/70">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
