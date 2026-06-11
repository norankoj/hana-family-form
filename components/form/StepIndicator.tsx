'use client';

interface StepIndicatorProps {
  current: number;   // 1-based
  total: number;
  labels: string[];
}

export default function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      {/* 프로그레스 바 */}
      <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden mb-3">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-500"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>

      {/* 스텝 도트 + 레이블 */}
      <div className="flex items-start justify-between">
        {labels.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <div key={step} className="flex flex-col items-center gap-1" style={{ width: `${100 / total}%` }}>
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all',
                  done   ? 'bg-blue-500 text-white'
                  : active ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                  :          'bg-slate-200 text-slate-400',
                ].join(' ')}
              >
                {done ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : step}
              </div>
              <span
                className={`text-center text-[10px] leading-tight font-medium ${
                  active ? 'text-blue-600' : done ? 'text-slate-400' : 'text-slate-300'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
