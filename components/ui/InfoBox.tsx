'use client';

interface InfoBoxProps {
  type?: 'info' | 'warning' | 'success';
  children: React.ReactNode;
}

const styles = {
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const icons = {
  info:    'ℹ️',
  warning: '⚠️',
  success: '✅',
};

export default function InfoBox({ type = 'info', children }: InfoBoxProps) {
  return (
    <div className={`flex gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}>
      <span className="mt-0.5 shrink-0 text-base leading-none">{icons[type]}</span>
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}
