'use client';

interface FieldGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export default function FieldGroup({ label, required, error, hint, children }: FieldGroupProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-base font-semibold text-slate-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 text-sm">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-slate-400">{hint}</p>}
      {error && <p className="text-sm text-red-500 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}
