"use client";

export default function ConfirmForm({
  action,
  confirmMessage,
  label,
  className,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label: string;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
