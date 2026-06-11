'use client';
import { useState } from 'react';
import { PRICING } from '@/config/pricing';
import type { Department, RegistrationType, LodgingType } from '@/config/pricing';
import { DEPT_MAP } from '@/config/pricing';

export interface PriceHighlight {
  department: string;
  registrationType: RegistrationType;
  lodging: LodgingType;
}

interface PriceTableProps {
  highlights?: PriceHighlight[];
}

const ROWS: { dept: Department; label: string; sub: string }[] = [
  { dept: 'ADULT_A',   label: '성인A',   sub: '2·3진,청년2부' },
  { dept: 'ADULT_B',   label: '성인B',   sub: 'UCM,청년1부' },
  { dept: 'YCM',       label: '중고등부', sub: 'YCM' },
  { dept: 'JOYLAND',   label: '초등부',   sub: '조이랜드' },
  { dept: 'KINDER',    label: '유치부',   sub: '40개월~' },
  { dept: 'BABY_PAID', label: '베이비',   sub: '13~39개월' },
  { dept: 'BABY_FREE', label: '베이비',   sub: '~12개월' },
];

const NON_LODGING_COLS: { reg: RegistrationType; label: string; date: string }[] = [
  { reg: 'EARLY',   label: '선등록',   date: '~07.15' },
  { reg: 'REGULAR', label: '일반등록', date: '07.16~07.24' },
  { reg: 'ONSITE',  label: '현장등록', date: '07.25' },
  { reg: 'DAILY',   label: '일일등록', date: '07.25~26' },
];
const LODGING_COLS: { reg: RegistrationType; label: string; date: string }[] = [
  { reg: 'EARLY',   label: '선등록',   date: '~07.15' },
  { reg: 'REGULAR', label: '일반등록', date: '07.16~07.24' },
  { reg: 'ONSITE',  label: '현장등록', date: '07.25' },
];

function fmt(n: number, compact = false) {
  if (n === 0) return '무료';
  if (compact) return (n / 10000) + '만';
  return (n / 10000).toLocaleString() + '만원';
}

function isLit(highlights: PriceHighlight[], dept: Department, reg: RegistrationType, lodging: LodgingType) {
  return highlights.some(
    (h) => DEPT_MAP[h.department] === dept && h.registrationType === reg && h.lodging === lodging,
  );
}

// ─── 실제 테이블 렌더 (compact 여부만 다름) ───────────────────────────────
function TableInner({ highlights, compact }: { highlights: PriceHighlight[]; compact: boolean }) {
  const th = compact
    ? 'border border-slate-200 px-1 py-1 text-[9px] font-semibold whitespace-nowrap'
    : 'border border-slate-200 px-2 py-2 text-xs font-semibold whitespace-nowrap';
  const td = compact
    ? 'border border-slate-200 px-0.5 py-1 text-[9px] font-medium'
    : 'border border-slate-200 px-1.5 py-2 text-xs font-medium';

  return (
    <table className="w-full text-center border-collapse">
      <thead>
        {/* 비숙박 / 숙박 그룹 헤더 */}
        <tr>
          <th rowSpan={2} className={`${th} bg-slate-50 text-slate-500 w-[13%]`}>구분</th>
          <th colSpan={4} className={`${th} bg-amber-50 text-amber-700`}>비숙박</th>
          <th colSpan={3} className={`${th} bg-blue-50 text-blue-700`}>
            숙박{!compact && <span className="font-normal text-blue-400"> (YCM·UCM·청년1부 기본)</span>}
          </th>
        </tr>
        {/* 날짜 행 */}
        <tr>
          {NON_LODGING_COLS.map((c) => (
            <th key={c.reg} className={`${th} bg-amber-50 text-amber-600`}>
              {compact ? c.label.replace('등록', '') : c.label}
              {!compact && <div className="text-[10px] font-normal text-amber-400">{c.date}</div>}
            </th>
          ))}
          {LODGING_COLS.map((c) => (
            <th key={c.reg} className={`${th} bg-blue-50 text-blue-600`}>
              {compact ? c.label.replace('등록', '') : c.label}
              {!compact && <div className="text-[10px] font-normal text-blue-400">{c.date}</div>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row) => {
          const isFree = row.dept === 'BABY_FREE';
          return (
            <tr key={row.dept}>
              <td className={`${td} bg-slate-50 text-left`}>
                <div className="font-semibold text-slate-700 leading-none">{row.label}</div>
                {!compact && <div className="text-[10px] text-slate-400 mt-0.5">{row.sub}</div>}
              </td>
              {isFree ? (
                <td colSpan={7} className={`${td} text-slate-400 font-bold`}>무료</td>
              ) : (
                <>
                  {NON_LODGING_COLS.map((c) => {
                    const price = PRICING[row.dept][c.reg].NON_LODGING;
                    const lit = isLit(highlights, row.dept, c.reg, 'NON_LODGING');
                    return (
                      <td key={c.reg} className={[
                        td,
                        lit ? 'bg-amber-400 text-white font-bold' : 'text-slate-700',
                      ].join(' ')}>
                        {fmt(price, compact)}
                      </td>
                    );
                  })}
                  {LODGING_COLS.map((c) => {
                    const price = PRICING[row.dept][c.reg].LODGING;
                    const lit = isLit(highlights, row.dept, c.reg, 'LODGING');
                    return (
                      <td key={c.reg} className={[
                        td,
                        lit ? 'bg-blue-500 text-white font-bold' : 'text-slate-700',
                      ].join(' ')}>
                        {fmt(price, compact)}
                      </td>
                    );
                  })}
                </>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────
export default function PriceTable({ highlights = [] }: PriceTableProps) {
  const [modal, setModal] = useState(false);

  return (
    <>
      {/* 압축 테이블 + 확대 버튼 */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <TableInner highlights={highlights} compact />
        <div className="border-t border-slate-100 px-3 py-2 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            <span className="font-semibold text-slate-500">성인A</span> 2·3진, 청년2부 &nbsp;·&nbsp;
            <span className="font-semibold text-slate-500">성인B</span> UCM, 청년1부 (숙박 기본)
          </p>
          <button
            type="button"
            onClick={() => setModal(true)}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            크게 보기
          </button>
        </div>
      </div>

      {/* 모달 */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setModal(false)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <p className="text-sm font-bold text-slate-800">2026 하나가족수양회 회비 안내</p>
              <button
                type="button"
                onClick={() => setModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 테이블 */}
            <div className="overflow-x-auto p-4">
              <TableInner highlights={highlights} compact={false} />
            </div>

            {/* 성인A/B 설명 + 날짜 안내 */}
            <div className="border-t border-slate-100 px-5 py-3 flex flex-col gap-1.5 text-xs text-slate-500">
              <p>
                <span className="font-semibold text-slate-600">성인A</span> — 2진, 3진, 청년2부
                &nbsp;·&nbsp;
                <span className="font-semibold text-slate-600">성인B</span> — UCM(대학부), 청년1부 (숙박 기본 포함)
              </p>
              <p className="text-slate-400">
                ✔ 선등록 ~07.15 &nbsp;·&nbsp; ✔ 일반등록 07.16~07.24 &nbsp;·&nbsp; ✔ 현장등록 07.25 &nbsp;·&nbsp; ✔ 일일등록 현장 접수
              </p>
            </div>

            {/* 닫기 버튼 */}
            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={() => setModal(false)}
                className="w-full rounded-xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
