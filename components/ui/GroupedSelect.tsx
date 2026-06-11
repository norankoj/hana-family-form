'use client';
import { useState, useRef, useEffect } from 'react';
import type { CellGroup } from '@/lib/cellData';

interface GroupedSelectProps {
  groups: CellGroup[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function GroupedSelect({
  groups,
  value,
  onChange,
  placeholder = '선택하세요',
}: GroupedSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const selectedLabel = groups
    .flatMap((g) => g.cells)
    .find((c) => c === value) ?? null;

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      // 선택된 항목으로 스크롤
      setTimeout(() => selectedItemRef.current?.scrollIntoView({ block: 'nearest' }), 0);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  function handleSelect(cell: string) {
    onChange(cell);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* 트리거 */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-base transition-all bg-white outline-none',
          open ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300',
          !selectedLabel ? 'text-slate-400' : 'text-slate-800',
        ].join(' ')}
      >
        <span className="truncate">{selectedLabel ?? placeholder}</span>
        <svg
          className={`ml-2 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <ul className="max-h-64 overflow-y-auto py-1">
            {groups.map((group) => (
              <li key={group.groupLabel}>
                {/* 그룹 헤더 */}
                <div className="flex items-center gap-2 px-4 py-1.5 mt-1 first:mt-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                    {group.groupLabel}
                  </span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* 셀 목록 */}
                {group.cells.map((cell) => {
                  const isSelected = cell === value;
                  return (
                    <button
                      key={cell}
                      ref={isSelected ? selectedItemRef : undefined}
                      type="button"
                      onClick={() => handleSelect(cell)}
                      className={[
                        'flex w-full items-center justify-between pl-7 pr-4 py-3 text-base transition-colors',
                        isSelected
                          ? 'bg-blue-50 font-semibold text-blue-700'
                          : 'text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <span>{cell}</span>
                      {isSelected && (
                        <svg className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
