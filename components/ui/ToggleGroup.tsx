'use client';

interface Option<T extends string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

interface ToggleGroupProps<T extends string> {
  options: Option<T>[];
  value: T | '';
  onChange: (value: T) => void;
  cols?: 1 | 2 | 3;
  disabled?: boolean;  // 그룹 전체 비활성화
}

export default function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  cols = 2,
  disabled: groupDisabled = false,
}: ToggleGroupProps<T>) {
  const gridCols = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }[cols];

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={opt.disabled || groupDisabled}
            onClick={() => !groupDisabled && onChange(opt.value)}
            className={[
              'flex flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-3.5',
              'text-base font-medium transition-all text-center',
              selected
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/40',
              (opt.disabled || groupDisabled) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <span>{opt.label}</span>
            {opt.description && (
              <span className={`text-sm font-normal ${selected ? 'text-blue-500' : 'text-slate-400'}`}>
                {opt.description}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
