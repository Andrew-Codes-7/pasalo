"use client";

/**
 * Shared form pieces for the post screens.
 *
 * Three forms with the same visual language, written once. The alternative was
 * copying the same input styling into each, which is how two of them end up
 * looking subtly different six weeks from now.
 */

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[15px] font-semibold text-content">
        {label}
        {required && <span className="ml-1 text-brand-600">*</span>}
      </p>
      {hint && <p className="mt-0.5 text-[13px] text-content-muted">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </div>
  );
}

const BASE =
  "w-full rounded-2xl border border-line bg-surface-2 px-4 py-3.5 text-[15px] text-content placeholder:text-content-faint focus:border-brand-500 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/12";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <input {...props} className={BASE} />;
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return <textarea {...props} className={`${BASE} resize-none leading-relaxed`} />;
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return <select {...props} className={`${BASE} appearance-none`} />;
}

export function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-3.5 py-2 text-sm font-medium transition",
        active
          ? "border-transparent bg-btn text-btn-fg"
          : "border-line text-content-muted hover:border-line-strong hover:text-content",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function SubmitBar({
  label,
  busy,
  disabled,
  error,
  onSubmit,
}: {
  label: string;
  busy: boolean;
  disabled: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 border-t border-line bg-surface/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl">
        {error && (
          <p
            role="alert"
            className="mb-2.5 rounded-xl border border-danger-500/40 bg-danger-500/10 p-2.5 text-[13px] leading-snug text-danger-500 dark:text-danger-400"
          >
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || busy}
          className="w-full rounded-full bg-btn py-3.5 text-[15px] font-semibold text-btn-fg transition hover:bg-btn-hover disabled:opacity-35"
        >
          {busy ? "…" : label}
        </button>
      </div>
    </div>
  );
}
