'use client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { PRICING, DEPT_MAP, LODGING_FIXED_DEPTS, MULTI_CHILD_DISCOUNT, type Department, type RegistrationType, type LodgingType } from '@/config/pricing';

// ── 타입 ────────────────────────────────────────────────────────────────────
interface Row {
  groupId:      string;
  신청일시:      string;
  신청유형:      string;   // '개인' | '단체'
  구분:          string;   // '대표자' | '일행'
  이름:          string;
  연락처:        string;
  소속:          string;
  셀번호:        string;
  등록유형:      string;
  참석날짜:      string;
  숙박:          string;   // '숙박' | '비숙박'
  가족실:        string;
  금액:          string;
  확정:          string;   // '확정' | ''
  입금확인:      string;   // '확인' | ''
}

interface Group {
  groupId:        string;
  type:           string;
  rows:           Row[];
  rep:            Row;
  total:          number;
  wantsFamilyRoom:boolean;
  confirmed:      boolean;
  paid:           boolean;
  신청일시:        string;
}

// ── 유틸 ────────────────────────────────────────────────────────────────────
function krw(n: number) {
  return n.toLocaleString('ko-KR') + '원';
}

// 헤더로 비밀번호 전송 (URL 노출 방지)
function authHeaders(password: string): HeadersInit {
  return { 'x-admin-password': password };
}

function buildGroups(rows: Row[], confirmed: Set<string>, paid: Set<string>): Group[] {
  const map = new Map<string, Row[]>();
  rows.forEach((r) => {
    const key = r.groupId || r.이름;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });
  return Array.from(map.entries()).map(([id, rs]) => {
    const rep = rs.find((r) => r.구분 === '대표자') ?? rs[0];
    return {
      groupId:   id,
      type:      rs[0].신청유형,
      rows:      rs,
      rep,
      total:     rs.reduce((s, r) => s + Number(r.금액 || 0), 0),
      wantsFamilyRoom: rs.some((r) => r.가족실 === '희망'),
      confirmed: confirmed.has(id),
      paid:      paid.has(id),
      신청일시:   rep.신청일시,
    };
  });
}

// ── 부서 통계 맵 ──────────────────────────────────────────────────────────
const DEPT_GROUPS: { label: string; match: (dept: string) => boolean }[] = [
  { label: '3진',       match: (d) => d === '3진' },
  { label: '2진',       match: (d) => d === '2진' },
  { label: '청년2부',   match: (d) => d.includes('청년2부') },
  { label: '청년1부',   match: (d) => d.includes('청년1부') },
  { label: 'EM',        match: (d) => d === 'EM' },
  { label: '새가족',    match: (d) => d.includes('새가족') },
  { label: 'UCM',       match: (d) => d.includes('UCM') || d.includes('대학') },
  { label: 'YCM',       match: (d) => d.includes('YCM') || d.includes('중고등') },
  { label: '조이랜드',  match: (d) => d.includes('조이랜드') || d.includes('초등') },
  { label: '조이코너',  match: (d) => d.includes('조이코너') || d.includes('유치') },
  { label: '조이베이비',match: (d) => d.includes('조이베이비') || d.includes('영아') || d.includes('베이비') },
];

function calcDeptStats(rows: Row[]) {
  return DEPT_GROUPS.map(({ label, match }) => ({
    label,
    count: rows.filter((r) => match(r.소속)).length,
  }));
}

// ── 로그인 화면 ──────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (pw: string) => void }) {
  const [pw, setPw]     = useState('');
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data', { headers: authHeaders(pw) });
      if (res.status === 401) { setErr('비밀번호가 틀렸습니다.'); return; }
      if (!res.ok)             { setErr('서버 오류가 발생했습니다.'); return; }
      onLogin(pw);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">관리자 페이지</h1>
          <p className="mt-1 text-sm text-slate-400">2026 하나가족수양회</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full rounded-sm border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          {err && <p className="text-xs text-red-500">{err}</p>}
          <button
            type="submit"
            disabled={!pw || loading}
            className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {loading ? '확인 중…' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── KPI 카드 ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit, sub }: {
  label: string; value: string | number; unit?: string; sub?: string;
}) {
  return (
    <div className="rounded-sm bg-white border border-slate-200 px-5 py-4">
      <p className="text-xs font-medium text-slate-400 mb-2">{label}</p>
      <p className="text-3xl font-bold text-slate-900 leading-none">
        {value}{unit && <span className="text-base font-semibold text-slate-400 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
    </div>
  );
}

// ── 진행률 바 ────────────────────────────────────────────────────────────
function ProgressBar({ label, done, total }: { label: string; done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-slate-600">{label}</span>
        <span className="text-sm font-bold text-blue-600">
          {done}<span className="text-slate-300 font-normal"> / {total}</span>
          <span className="ml-1.5 text-xs text-slate-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 w-full rounded-sm bg-slate-100 overflow-hidden">
        <div className="h-full rounded-sm bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── 상태 뱃지 ────────────────────────────────────────────────────────────
function StatusBadge({ g }: { g: Group }) {
  if (g.confirmed) return <span className="inline-flex items-center rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">확정 완료</span>;
  if (g.paid)      return <span className="inline-flex items-center rounded-sm bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">입금 확인</span>;
  return <span className="inline-flex items-center rounded-sm bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">신청 접수</span>;
}

function LodgeBadge({ value }: { value: string }) {
  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-semibold ${value === '숙박' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
      {value}
    </span>
  );
}

// ── 정렬 유틸 ────────────────────────────────────────────────────────────────
type SortDir = 'asc' | 'desc' | null;

function SortIcon({ dir }: { dir: SortDir }) {
  if (dir === 'asc')  return <span className="ml-0.5 text-blue-500 text-[9px]">▲</span>;
  if (dir === 'desc') return <span className="ml-0.5 text-blue-500 text-[9px]">▼</span>;
  return <span className="ml-0.5 opacity-25 text-[9px]">▲▼</span>;
}

function SortTh({ label, col, active, dir, onSort, align = 'left' }: {
  label: string; col: string; active: boolean; dir: SortDir;
  onSort: (col: string) => void; align?: 'left' | 'center' | 'right';
}) {
  const alignCls = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      onClick={() => onSort(col)}
      className={`cursor-pointer select-none border-b border-slate-200 px-3 py-2.5 whitespace-nowrap transition-colors ${alignCls} ${
        active ? 'text-blue-600 bg-blue-50/60' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {label}<SortIcon dir={active ? dir : null} />
    </th>
  );
}

// ── 개인 신청 테이블 ──────────────────────────────────────────────────────
type IndivSortKey = 'status' | 'name' | 'dept' | 'cell' | 'regType' | 'lodging' | 'amount' | 'date';

// "1A10 김보미" → "1A10" (숫자+문자 코드만 추출해서 정렬)
function cellCode(s: string): string { return s?.split(' ')[0] ?? ''; }

// UCM·YCM은 셀번호 대신 소속명 표시
function cellDisplay(셀번호: string, 소속: string): string {
  if (!셀번호) {
    if (소속.includes('UCM') || 소속.includes('대학')) return 'UCM';
    if (소속.includes('YCM') || 소속.includes('중고등')) return 'YCM';
    return '—';
  }
  return 셀번호;
}

function IndividualTable({ groups, password, onConfirm, onPaid, onDelete, onEdit }: {
  groups: Group[]; password: string; onConfirm: (id: string) => void; onPaid: (id: string) => void; onDelete: (id: string) => void; onEdit: (g: Group) => void;
}) {
  const [sortKey, setSortKey] = useState<IndivSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function toggleSort(col: string) {
    const key = col as IndivSortKey;
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortKey(null); setSortDir(null);
  }

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return groups;
    const m = sortDir === 'asc' ? 1 : -1;
    return [...groups].sort((a, b) => {
      switch (sortKey) {
        case 'status':  return ((a.confirmed ? 2 : a.paid ? 1 : 0) - (b.confirmed ? 2 : b.paid ? 1 : 0)) * m;
        case 'name':    return a.rep.이름.localeCompare(b.rep.이름, 'ko') * m;
        case 'dept':    return a.rep.소속.localeCompare(b.rep.소속, 'ko') * m;
        case 'regType': return a.rep.등록유형.localeCompare(b.rep.등록유형, 'ko') * m;
        case 'lodging': return a.rep.숙박.localeCompare(b.rep.숙박, 'ko') * m;
        case 'cell':    return cellCode(a.rep.셀번호).localeCompare(cellCode(b.rep.셀번호)) * m;
        case 'amount':  return (a.total - b.total) * m;
        case 'date':    return a.신청일시.localeCompare(b.신청일시) * m;
        default: return 0;
      }
    });
  }, [groups, sortKey, sortDir]);

  if (groups.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">신청 내역이 없습니다.</p>;

  const th = (col: string, label: string, align?: 'left' | 'center' | 'right') => (
    <SortTh col={col} label={label} active={sortKey === col} dir={sortDir} onSort={toggleSort} align={align} />
  );
  const plainTh = (label: string, align: 'left' | 'center' | 'right' = 'center') => (
    <th className={`border-b border-slate-200 px-3 py-2.5 whitespace-nowrap text-slate-500 text-${align}`}>{label}</th>
  );

  return (
    <div>
      <div className="overflow-auto max-h-[560px]">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 bg-slate-50 text-xs shadow-[0_1px_0_0_#e2e8f0]">
              {th('status',  '상태')}
              {th('name',    '이름')}
              {plainTh('연락처')}
              {th('dept',    '소속', 'center')}
              {th('cell',    '셀번호', 'center')}
              {th('regType', '등록유형', 'center')}
              {th('lodging', '숙박', 'center')}
              {th('amount',  '금액', 'right')}
              {th('date',    '신청일시', 'center')}
              {plainTh('입금확인')}
              {plainTh('확정')}
              {plainTh('관리')}
            </tr>
          </thead>
          <tbody>
            {sorted.map((g) => {
              const rep = g.rep;
              return (
                <tr key={g.groupId} className={`${g.confirmed ? 'bg-emerald-50/40' : 'bg-white hover:bg-slate-50'} border-b border-slate-100`}>
                  <td className="px-3 py-2.5"><StatusBadge g={g} /></td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800">{rep.이름}</td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap text-slate-600">{rep.연락처}</td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap text-slate-600">{rep.소속}</td>
                  <td className="px-3 py-2.5 text-center text-slate-500">{cellDisplay(rep.셀번호, rep.소속)}</td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap text-slate-600">{rep.등록유형}</td>
                  <td className="px-3 py-2.5 text-center"><LodgeBadge value={rep.숙박} /></td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800 whitespace-nowrap">{krw(g.total)}</td>
                  <td className="px-3 py-2.5 text-center text-xs text-slate-400 whitespace-nowrap">{rep.신청일시}</td>
                  <td className="px-3 py-2.5 text-center">
                    {g.paid ? <span className="text-emerald-600 font-bold text-xs">✓ 확인</span>
                            : <PaymentButton groupId={g.groupId} password={password} onPaid={onPaid} />}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {g.confirmed ? <span className="text-blue-600 font-bold text-xs">✓ 확정</span>
                                 : <ConfirmButton groupId={g.groupId} password={password} group={g} onConfirm={onConfirm} />}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button type="button" onClick={() => onEdit(g)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
                        수정
                      </button>
                      <DeleteButton groupId={g.groupId} label={rep.이름} password={password} onDelete={onDelete} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── 단체 신청 카드 ──────────────────────────────────────────────────────
function GroupCard({ g, password, onConfirm, onPaid, onDelete, onEdit }: {
  g: Group; password: string; onConfirm: (id: string) => void; onPaid: (id: string) => void; onDelete: (id: string) => void; onEdit: (g: Group) => void;
}) {
  const [open, setOpen] = useState(false);
  const memberCount = g.rows.filter((r) => r.구분 !== '할인').length;
  return (
    <div className={`rounded-sm border ${g.confirmed ? 'border-emerald-200' : 'border-slate-200'}`}>
      {/* 그룹 헤더 */}
      <div className={`flex items-center justify-between gap-3 px-4 py-3 ${g.confirmed ? 'bg-emerald-50/60' : 'bg-slate-50'}`}>
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-3 flex-wrap text-left min-w-0">
          <svg className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <StatusBadge g={g} />
          <span className="font-bold text-slate-900">{g.rep.이름} <span className="font-normal text-slate-400">외 {memberCount - 1}명</span></span>
          {g.wantsFamilyRoom && (
            <span className="inline-flex items-center rounded-sm border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">🛏 가족실</span>
          )}
          <span className="text-xs text-slate-400">{g.rep.연락처}</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-bold text-slate-800 mr-1 whitespace-nowrap">{krw(g.total)}</span>
          {g.paid ? <span className="inline-flex items-center rounded-sm bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ 입금</span>
                  : <PaymentButton groupId={g.groupId} password={password} onPaid={onPaid} />}
          {g.confirmed ? <span className="inline-flex items-center rounded-sm bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">✓ 확정</span>
                       : <ConfirmButton groupId={g.groupId} password={password} group={g} onConfirm={onConfirm} />}
          <button type="button" onClick={() => onEdit(g)}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors whitespace-nowrap">
            수정
          </button>
          <DeleteButton groupId={g.groupId} label={`${g.rep.이름} 외 ${memberCount - 1}명`} password={password} onDelete={onDelete} />
        </div>
      </div>
      {/* 멤버 목록 */}
      {open && (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-xs text-slate-400 bg-white border-b border-slate-100">
              <th className="px-4 py-1.5 text-left">구분</th>
              <th className="px-4 py-1.5 text-left">이름</th>
              <th className="px-4 py-1.5">소속</th>
              <th className="px-4 py-1.5">등록유형</th>
              <th className="px-4 py-1.5">숙박</th>
              <th className="px-4 py-1.5 text-right">금액</th>
            </tr>
          </thead>
          <tbody>
            {g.rows.map((row, i) => (
              row.구분 === '할인' ? (
                <tr key={i} className="border-t border-slate-100 bg-slate-50">
                  <td className="px-4 py-2" colSpan={5}>
                    <span className="text-xs font-semibold text-slate-500">{row.이름}</span>
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-blue-600">{krw(Number(row.금액 || 0))}</td>
                </tr>
              ) : (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-2">
                    <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-semibold ${row.구분 === '대표자' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{row.구분}</span>
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-800">{row.이름}</td>
                  <td className="px-4 py-2 text-center text-slate-600 whitespace-nowrap">{row.소속}</td>
                  <td className="px-4 py-2 text-center text-slate-600 whitespace-nowrap">{row.등록유형}</td>
                  <td className="px-4 py-2 text-center"><LodgeBadge value={row.숙박} /></td>
                  <td className="px-4 py-2 text-right font-semibold text-slate-700">{krw(Number(row.금액 || 0))}</td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

type GroupSortKey = 'status' | 'name' | 'count' | 'amount' | 'date';

function GroupTable({ groups, password, onConfirm, onPaid, onDelete, onEdit }: {
  groups: Group[]; password: string; onConfirm: (id: string) => void; onPaid: (id: string) => void; onDelete: (id: string) => void; onEdit: (g: Group) => void;
}) {
  const [sortKey, setSortKey] = useState<GroupSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function toggleSort(key: GroupSortKey) {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortKey(null); setSortDir(null);
  }

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return groups;
    const m = sortDir === 'asc' ? 1 : -1;
    return [...groups].sort((a, b) => {
      switch (sortKey) {
        case 'status': return ((a.confirmed ? 2 : a.paid ? 1 : 0) - (b.confirmed ? 2 : b.paid ? 1 : 0)) * m;
        case 'name':   return a.rep.이름.localeCompare(b.rep.이름, 'ko') * m;
        case 'count':  return (a.rows.filter((r) => r.구분 !== '할인').length - b.rows.filter((r) => r.구분 !== '할인').length) * m;
        case 'amount': return (a.total - b.total) * m;
        case 'date':   return a.신청일시.localeCompare(b.신청일시) * m;
        default: return 0;
      }
    });
  }, [groups, sortKey, sortDir]);

  if (groups.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">신청 내역이 없습니다.</p>;

  const sortOptions: { key: GroupSortKey; label: string }[] = [
    { key: 'name',   label: '이름' },
    { key: 'count',  label: '인원' },
    { key: 'amount', label: '금액' },
    { key: 'date',   label: '신청일' },
    { key: 'status', label: '상태' },
  ];

  return (
    <div className="flex flex-col gap-3">
      {/* 정렬 컨트롤 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-slate-400">정렬</span>
        {sortOptions.map(({ key, label }) => {
          const active = sortKey === key;
          return (
            <button key={key} type="button" onClick={() => toggleSort(key)}
              className={`flex items-center gap-0.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}>
              {label}<SortIcon dir={active ? sortDir : null} />
            </button>
          );
        })}
        {sortKey && (
          <button type="button" onClick={() => { setSortKey(null); setSortDir(null); }}
            className="text-xs text-slate-400 hover:text-slate-600 ml-1">
            초기화
          </button>
        )}
      </div>
      <div className="overflow-auto max-h-[560px] flex flex-col gap-3 pr-0.5">
        {sorted.map((g) => <GroupCard key={g.groupId} g={g} password={password} onConfirm={onConfirm} onPaid={onPaid} onDelete={onDelete} onEdit={onEdit} />)}
      </div>
    </div>
  );
}

// ── 가족실 현황 ──────────────────────────────────────────────────────────
function FamilyRoomBoard({ groups }: { groups: Group[] }) {
  const rooms = groups.filter((g) => g.wantsFamilyRoom);
  if (rooms.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">가족실을 희망한 신청이 없습니다.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs text-slate-500">
            <th className="border-b border-slate-200 px-3 py-2.5 text-left whitespace-nowrap">대표자</th>
            <th className="border-b border-slate-200 px-3 py-2.5 whitespace-nowrap">연락처</th>
            <th className="border-b border-slate-200 px-3 py-2.5 whitespace-nowrap">인원</th>
            <th className="border-b border-slate-200 px-3 py-2.5 whitespace-nowrap">숙박 인원</th>
            <th className="border-b border-slate-200 px-3 py-2.5 text-left whitespace-nowrap">구성원</th>
            <th className="border-b border-slate-200 px-3 py-2.5 whitespace-nowrap">상태</th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((g) => {
            const members = g.rows.filter((r) => r.구분 !== '할인');
            const lodgingCnt = members.filter((r) => r.숙박 === '숙박').length;
            return (
              <tr key={g.groupId} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{g.rep.이름}</td>
                <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">{g.rep.연락처}</td>
                <td className="px-3 py-2.5 text-center font-bold text-blue-700">{members.length}명</td>
                <td className="px-3 py-2.5 text-center text-slate-600">{lodgingCnt}명</td>
                <td className="px-3 py-2.5 text-slate-600 text-xs">{members.map((r) => r.이름).join(', ')}</td>
                <td className="px-3 py-2.5 text-center"><StatusBadge g={g} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── 부서별 명단 (드릴다운) ───────────────────────────────────────────────
type DeptSortKey = 'name' | 'cell' | 'regType' | 'lodging' | 'status';

function DeptMemberTable({ groups, match }: { groups: Group[]; match: (d: string) => boolean }) {
  const [sortKey, setSortKey] = useState<DeptSortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function toggleSort(col: string) {
    const key = col as DeptSortKey;
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortKey(null); setSortDir(null);
  }

  const raw = groups.flatMap((g) =>
    g.rows.filter((r) => match(r.소속)).map((r) => ({ r, g })),
  );

  const members = useMemo(() => {
    if (!sortKey || !sortDir) return raw;
    const m = sortDir === 'asc' ? 1 : -1;
    return [...raw].sort((a, b) => {
      switch (sortKey) {
        case 'name':    return a.r.이름.localeCompare(b.r.이름, 'ko') * m;
        case 'cell':    return cellCode(a.r.셀번호).localeCompare(cellCode(b.r.셀번호)) * m;
        case 'regType': return a.r.등록유형.localeCompare(b.r.등록유형, 'ko') * m;
        case 'lodging': return a.r.숙박.localeCompare(b.r.숙박, 'ko') * m;
        case 'status':  return ((a.g.confirmed ? 2 : a.g.paid ? 1 : 0) - (b.g.confirmed ? 2 : b.g.paid ? 1 : 0)) * m;
        default: return 0;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw.length, sortKey, sortDir, groups]);

  if (raw.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">해당 부서 신청 인원이 없습니다.</p>;

  const th = (col: string, label: string, align?: 'left' | 'center' | 'right') => (
    <SortTh col={col} label={label} active={sortKey === col} dir={sortDir} onSort={toggleSort} align={align} />
  );
  const plainTh = (label: string, align: 'left' | 'center' | 'right' = 'center') => (
    <th className={`border-b border-slate-200 px-3 py-2.5 whitespace-nowrap text-slate-500 text-${align}`}>{label}</th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs">
            {th('name',    '이름', 'left')}
            {plainTh('소속')}
            {th('cell',    '셀번호')}
            {plainTh('구분')}
            {th('regType', '등록유형')}
            {th('lodging', '숙박')}
            {plainTh('소속 신청(대표자)', 'left')}
            {th('status',  '상태')}
          </tr>
        </thead>
        <tbody>
          {members.map(({ r, g }, i) => (
            <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">{r.이름}</td>
              <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">{r.소속}</td>
              <td className="px-3 py-2.5 text-center text-slate-500">{cellCode(r.셀번호) || '—'}</td>
              <td className="px-3 py-2.5 text-center">
                <span className={`inline-block rounded-sm px-2 py-0.5 text-xs font-semibold ${g.type === '개인' ? 'bg-slate-100 text-slate-500' : r.구분 === '대표자' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                  {g.type === '개인' ? '개인' : r.구분}
                </span>
              </td>
              <td className="px-3 py-2.5 text-center text-slate-600 whitespace-nowrap">{r.등록유형}</td>
              <td className="px-3 py-2.5 text-center"><LodgeBadge value={r.숙박} /></td>
              <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{g.type === '개인' ? '—' : g.rep.이름}</td>
              <td className="px-3 py-2.5 text-center"><StatusBadge g={g} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── 수정 모달 (유형/숙박 수정 + 금액 자동계산) ──────────────────────────────
const REG_TYPE_TO_CODE: Record<string, RegistrationType> = {
  '선등록': 'EARLY', '일반등록': 'REGULAR', '현장등록': 'ONSITE', '일일등록': 'DAILY',
};

// 사역자 할인 금액 (admin 전용 — 신청 폼에는 노출되지 않음)
const MINISTRY_PRICE: Record<Department, number> = {
  ADULT_A:   40_000,
  ADULT_B:   40_000,
  YCM:       37_500,
  JOYLAND:   35_000,
  KINDER:    25_000,
  BABY_PAID:  7_500,
  BABY_FREE:      0,
};

interface EditRow { 이름: string; 소속: string; 구분: string; 등록유형: string; 숙박: string; }

function calcEditPrices(editRows: EditRow[]): { prices: number[]; discount: number; total: number } {
  const prices = editRows.map((m) => {
    const dept = DEPT_MAP[m.소속];
    if (!dept) return 0;
    if (m.등록유형 === '선교사') return 0;
    // 사역자는 별도 요금표 적용 (숙박 무관)
    if (m.등록유형 === '사역자') return MINISTRY_PRICE[dept];
    const regType = REG_TYPE_TO_CODE[m.등록유형] as RegistrationType | undefined;
    if (!regType) return 0;
    const lodging: LodgingType = m.숙박 === '숙박' ? 'LODGING' : 'NON_LODGING';
    return PRICING[dept][regType][lodging];
  });
  const subtotal = prices.reduce((s, p) => s + p, 0);
  // 사역자·선교사는 다자녀 할인 대상에서 제외
  const childCount = editRows.filter((m) => {
    if (m.등록유형 === '사역자' || m.등록유형 === '선교사') return false;
    const dept = DEPT_MAP[m.소속];
    return dept && MULTI_CHILD_DISCOUNT.eligibleChildDepts.includes(dept);
  }).length;
  let discountRate = 0;
  for (const tier of MULTI_CHILD_DISCOUNT.tiers) {
    if (childCount >= tier.minChildren) { discountRate = tier.rate; break; }
  }
  const discount = Math.floor(subtotal * discountRate);
  return { prices, discount, total: subtotal - discount };
}

function EditModal({ group, password, onClose, onSaved }: {
  group: Group; password: string; onClose: () => void; onSaved: () => void;
}) {
  const [editRows, setEditRows] = useState<EditRow[]>(() =>
    group.rows
      .filter((r) => r.구분 !== '할인')
      .map((r) => ({ 이름: r.이름, 소속: r.소속, 구분: r.구분, 등록유형: r.등록유형, 숙박: r.숙박 })),
  );
  const [saving, setSaving] = useState(false);

  function update(i: number, field: keyof Pick<EditRow, '등록유형' | '숙박'>, value: string) {
    setEditRows((prev) => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  }

  const { prices, discount, total } = useMemo(() => calcEditPrices(editRows), [editRows]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          groupId: group.groupId,
          members: editRows.map((m, i) => ({ 이름: m.이름, 등록유형: m.등록유형, 숙박: m.숙박, 금액: prices[i] })),
          discountAmount: discount,
        }),
      });
      if (res.ok) { onSaved(); onClose(); }
      else { const j = await res.json().catch(() => ({})); alert(j.error ?? '수정 중 오류가 발생했습니다.'); }
    } catch { alert('수정 중 오류가 발생했습니다.'); }
    finally { setSaving(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-sm">신청 수정 — {group.rep.이름}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
        </div>
        {editRows.length > 1 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
            <span className="text-xs text-slate-400">{editRows.length}명</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditRows((prev) => prev.map((m) => ({ ...m, 등록유형: '사역자' })))}
                className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors"
              >
                전체 사역자 적용
              </button>
              <button
                type="button"
                onClick={() => setEditRows((prev) => prev.map((m) => ({ ...m, 등록유형: '선교사' })))}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              >
                전체 선교사 적용
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-2 p-4 max-h-[60vh] overflow-auto">
          {editRows.map((m, i) => {
            const isMinistry    = m.등록유형 === '사역자';
            const isMissionary  = m.등록유형 === '선교사';
            const rowCls = isMinistry  ? 'border-purple-200 bg-purple-50/40'
                         : isMissionary ? 'border-amber-200 bg-amber-50/40'
                         : 'border-slate-200';
            const selectCls = isMinistry  ? 'border-purple-300 bg-purple-50 text-purple-700 focus:border-purple-500'
                            : isMissionary ? 'border-amber-300 bg-amber-50 text-amber-700 focus:border-amber-500'
                            : 'border-slate-300 focus:border-blue-500';
            const amtCls = isMinistry ? 'text-purple-700' : isMissionary ? 'text-amber-700' : 'text-slate-700';
            return (
              <div key={i} className={`grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 rounded-sm border px-3 py-2.5 ${rowCls}`}>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{m.이름}</p>
                  <p className="text-xs text-slate-400 truncate">{m.소속}</p>
                </div>
                <select
                  value={m.등록유형}
                  onChange={(e) => update(i, '등록유형', e.target.value)}
                  className={`rounded border px-2 py-1.5 text-xs focus:outline-none ${selectCls}`}
                >
                  <optgroup label="일반">
                    <option value="선등록">선등록</option>
                    <option value="일반등록">일반등록</option>
                    <option value="현장등록">현장등록</option>
                    <option value="일일등록">일일등록</option>
                  </optgroup>
                  <optgroup label="관리자 전용">
                    <option value="사역자">사역자</option>
                    <option value="선교사">선교사</option>
                  </optgroup>
                </select>
                <select
                  value={m.숙박}
                  onChange={(e) => update(i, '숙박', e.target.value)}
                  className="rounded border border-slate-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="숙박">숙박</option>
                  <option value="비숙박">비숙박</option>
                </select>
                <div className="text-right min-w-[64px]">
                  {(isMinistry || isMissionary) && (
                    <p className={`text-[10px] font-semibold leading-none mb-0.5 ${isMinistry ? 'text-purple-500' : 'text-amber-500'}`}>
                      {isMinistry ? '사역자' : '선교사'}
                    </p>
                  )}
                  <p className={`font-bold text-sm whitespace-nowrap ${amtCls}`}>{krw(prices[i])}</p>
                </div>
              </div>
            );
          })}
          {discount > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-sm bg-slate-50 text-sm">
              <span className="text-slate-500">다자녀 할인</span>
              <span className="font-bold text-blue-600">-{krw(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-sm bg-blue-50">
            <span className="text-sm font-bold text-slate-700">합계</span>
            <span className="text-base font-bold text-blue-700">{krw(total)}</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            취소
          </button>
          <button onClick={handleSave} disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 확정 버튼 ──────────────────────────────────────────────────────────────
function ConfirmButton({ groupId, password, group, onConfirm }: {
  groupId: string; password: string; group: Group; onConfirm: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    if (!confirm('이 신청을 확정하시겠습니까?\n(카카오톡 알림이 발송됩니다)')) return;
    setLoading(true);
    const DEPT_SHORT: Record<string, string> = {
      '대학부(UCM)': 'UCM', '중고등부(YCM)': 'YCM', '초등부(조이랜드)': '초등부',
      '유치부(40개월~미취학)': '유치부', '베이비(13개월~39개월)': '베이비', '베이비(~12개월)': '베이비',
      '새가족(셀소속 전)': '새가족',
    };
    const members = group.rows
      .filter((r) => r.구분 !== '할인')
      .map((r) => `${r.이름} (${DEPT_SHORT[r.소속] ?? r.소속})`);
    try {
      const res = await fetch('/api/admin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password, groupId, action: 'confirm',
          name:    group.rep.이름,
          phone:   group.rep.연락처,
          regType: group.rep.등록유형,
          members,
          total:   group.total,
        }),
      });
      if (res.ok) onConfirm(groupId);
      else alert('확정 처리 중 오류가 발생했습니다.');
    } finally { setLoading(false); }
  }
  return (
    <button type="button" onClick={handleClick} disabled={loading}
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">
      {loading ? '처리중…' : '확정'}
    </button>
  );
}

// ── 입금확인 버튼 ──────────────────────────────────────────────────────────
function PaymentButton({ groupId, password, onPaid }: {
  groupId: string; password: string; onPaid: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    if (!confirm('입금을 확인하셨나요?')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, groupId, action: 'payment' }),
      });
      if (res.ok) onPaid(groupId);
      else alert('처리 중 오류가 발생했습니다.');
    } finally { setLoading(false); }
  }
  return (
    <button type="button" onClick={handleClick} disabled={loading}
      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors whitespace-nowrap">
      {loading ? '처리중…' : '입금확인'}
    </button>
  );
}

// ── 삭제 버튼 ──────────────────────────────────────────────────────────────
function DeleteButton({ groupId, label, password, onDelete }: {
  groupId: string; label: string; password: string; onDelete: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    if (!confirm(`'${label}' 신청을 삭제할까요?\n\n구글시트(엑셀)에서도 함께 삭제되며 되돌릴 수 없습니다.`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, groupId }),
      });
      if (res.ok) onDelete(groupId);
      else alert('삭제 중 오류가 발생했습니다.');
    } finally { setLoading(false); }
  }
  return (
    <button type="button" onClick={handleClick} disabled={loading}
      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 hover:border-red-200 disabled:opacity-50 transition-colors whitespace-nowrap">
      {loading ? '삭제중…' : '삭제'}
    </button>
  );
}

// ── CSV 내보내기 ──────────────────────────────────────────────────────────
function exportCsv(rows: Row[]) {
  const headers = ['신청번호','신청일시','신청유형','구분','이름','연락처','소속','셀번호','등록유형','참석날짜','숙박','가족실','금액','확정','입금확인'];
  const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""')}"`;
  const lines = rows.map((r) => [
    r.groupId, r.신청일시, r.신청유형, r.구분, r.이름, r.연락처, r.소속, r.셀번호,
    r.등록유형, r.참석날짜, r.숙박, r.가족실, r.금액, r.확정, r.입금확인,
  ].map(esc).join(','));
  const csv = '﻿' + [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `하나가족수양회_신청현황_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── 메인 대시보드 ──────────────────────────────────────────────────────────
type Tab = 'all' | 'individual' | 'group' | 'family';

function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState<Tab>('all');
  const [search, setSearch]   = useState('');
  const [deptFilter, setDeptFilter] = useState<string | null>(null); // 부서별 드릴다운
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [paid, setPaid]           = useState<Set<string>>(new Set());
  const [editGroup, setEditGroup] = useState<Group | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/data', { headers: authHeaders(password) });
      const json = await res.json();
      if (!json.ok) { setError(json.error ?? '오류'); return; }
      const data: Row[] = json.rows ?? [];
      setRows(data);
      setConfirmed(new Set(data.filter((r) => r.확정 === '확정').map((r) => r.groupId)));
      setPaid(new Set(data.filter((r) => r.입금확인 === '확인').map((r) => r.groupId)));
    } catch {
      if (!silent) setError('데이터를 불러오지 못했습니다.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const groups = useMemo(() => buildGroups(rows, confirmed, paid), [rows, confirmed, paid]);

  // ── 통계 ── ('할인' 행은 인원이 아니므로 제외)
  const totalPeople   = rows.filter((r) => r.구분 !== '할인').length;
  const lodgingCount  = rows.filter((r) => r.숙박 === '숙박').length;
  const nonLodging    = totalPeople - lodgingCount;
  const deptStats     = calcDeptStats(rows);
  const totalGroups   = groups.length;
  const confirmedCnt  = groups.filter((g) => g.confirmed).length;
  const paidCnt       = groups.filter((g) => g.paid).length;
  const familyRoomCnt = groups.filter((g) => g.wantsFamilyRoom).length;
  const expectedTotal = rows.reduce((s, r) => s + Number(r.금액 || 0), 0);
  const indivCnt      = groups.filter((g) => g.type === '개인').length;
  const groupCnt      = groups.filter((g) => g.type === '단체').length;

  function handleConfirm(id: string) { setConfirmed((p) => new Set([...p, id])); }
  function handlePaid(id: string)    { setPaid((p) => new Set([...p, id])); }
  function handleDelete(id: string)  { setRows((prev) => prev.filter((r) => r.groupId !== id)); }

  // ── 검색 + 탭 필터 ──
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let gs = groups;
    if (q) {
      gs = gs.filter((g) =>
        g.rows.some((r) => r.이름.toLowerCase().includes(q) || (r.연락처 ?? '').includes(q) || (r.소속 ?? '').toLowerCase().includes(q)),
      );
    }
    if (tab === 'individual') return gs.filter((g) => g.type === '개인');
    if (tab === 'group')      return gs.filter((g) => g.type === '단체');
    if (tab === 'family')     return gs.filter((g) => g.wantsFamilyRoom);
    return gs;
  }, [groups, search, tab]);

  const activeDept = deptFilter ? DEPT_GROUPS.find((d) => d.label === deptFilter) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-50">
      {editGroup && (
        <EditModal group={editGroup} password={password} onClose={() => setEditGroup(null)} onSaved={() => load(true)} />
      )}
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-semibold">관리자 대시보드</p>
            <p className="text-base font-bold text-slate-900">2026 하나가족수양회</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => exportCsv(rows)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
              엑셀(CSV)
            </button>
            <button type="button" onClick={() => load()}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115 0M20 15a9 9 0 01-15 0" />
              </svg>
              새로고침
            </button>
            <button type="button" onClick={onLogout}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors ml-1">로그아웃</button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 flex flex-col gap-6">
        {error && <div className="rounded-sm bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>}
        {loading && <div className="text-center py-16 text-slate-400 text-sm">불러오는 중…</div>}

        {!loading && !error && (
          <>
            {/* KPI 카드 */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              <KpiCard label="총 신청"     value={totalGroups} unit="건" sub={`개인 ${indivCnt} · 단체 ${groupCnt}`} />
              <KpiCard label="총 인원"     value={totalPeople} unit="명" />
              <KpiCard label="숙박"        value={lodgingCount} unit="명" sub={`비숙박 ${nonLodging}명`} />
              <KpiCard label="가족실 희망" value={familyRoomCnt} unit="팀" />
              <KpiCard label="입금 확인"   value={paidCnt}      unit="건" sub={`미확인 ${totalGroups - paidCnt}건`} />
              <KpiCard label="예상 회비"   value={(expectedTotal / 10000).toLocaleString()} unit="만원" sub="할인 반영 합계" />
            </div>

            {/* 진행률 + 부서별 */}
            <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
              <div className="rounded-sm bg-white border border-slate-200 px-5 py-5 flex flex-col gap-4 justify-center">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">처리 진행률</h2>
                <ProgressBar label="입금 확인"  done={paidCnt}      total={totalGroups} />
                <ProgressBar label="확정 완료"  done={confirmedCnt} total={totalGroups} />
              </div>

              <div className="rounded-sm bg-white border border-slate-200 px-5 py-5">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  부서별 현황 <span className="text-slate-300 normal-case font-normal">· 클릭하면 명단을 볼 수 있어요</span>
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-11 gap-2">
                  {deptStats.map(({ label, count }) => {
                    const active = deptFilter === label;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setDeptFilter(active ? null : label)}
                        className={`rounded-sm px-2 py-3 text-center transition-colors border ${
                          active ? 'border-blue-500 bg-blue-50' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        <p className={`text-xs font-medium whitespace-nowrap ${active ? 'text-blue-600' : 'text-slate-500'}`}>{label}</p>
                        <p className={`text-2xl font-bold mt-1 ${active ? 'text-blue-700' : 'text-slate-900'}`}>{count}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 부서별 드릴다운 패널 */}
            {activeDept && (
              <div className="rounded-sm bg-white border border-blue-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-b border-blue-100">
                  <h3 className="text-sm font-bold text-blue-800">
                    {activeDept.label} 부서 명단
                    <span className="ml-2 font-normal text-blue-500">
                      {rows.filter((r) => activeDept.match(r.소속)).length}명
                    </span>
                  </h3>
                  <button type="button" onClick={() => setDeptFilter(null)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700">✕ 닫기</button>
                </div>
                <div className="p-4">
                  <DeptMemberTable groups={groups} match={activeDept.match} />
                </div>
              </div>
            )}

            {/* 검색 + 탭 */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex gap-2 flex-wrap">
                  {([
                    { key: 'all',        label: `전체 ${totalGroups}` },
                    { key: 'individual', label: `개인 ${indivCnt}` },
                    { key: 'group',      label: `단체 ${groupCnt}` },
                    { key: 'family',     label: `가족실 ${familyRoomCnt}` },
                  ] as const).map(({ key, label }) => (
                    <button key={key} type="button" onClick={() => setTab(key)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        tab === key ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative sm:w-64">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="이름·연락처·소속 검색"
                    className="w-full rounded-sm border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 테이블 영역 */}
              <div className="rounded-sm bg-white border border-slate-200 p-4">
                {tab === 'individual' ? (
                  <IndividualTable groups={filtered} password={password} onConfirm={handleConfirm} onPaid={handlePaid} onDelete={handleDelete} onEdit={setEditGroup} />
                ) : tab === 'group' ? (
                  <GroupTable groups={filtered} password={password} onConfirm={handleConfirm} onPaid={handlePaid} onDelete={handleDelete} onEdit={setEditGroup} />
                ) : tab === 'family' ? (
                  filtered.length === 0 ? (
                    <p className="text-sm text-slate-400 py-6 text-center">가족실 신청 내역이 없습니다.</p>
                  ) : (
                    <>
                      {filtered.some((g) => g.type === '개인') && (
                        <>
                          <h3 className="text-sm font-bold text-slate-700 mb-3">개인 신청 (가족실)</h3>
                          <IndividualTable groups={filtered.filter((g) => g.type === '개인')} password={password} onConfirm={handleConfirm} onPaid={handlePaid} onDelete={handleDelete} onEdit={setEditGroup} />
                        </>
                      )}
                      {filtered.some((g) => g.type === '단체') && (
                        <div className={filtered.some((g) => g.type === '개인') ? 'mt-6 pt-6 border-t border-slate-100' : ''}>
                          <h3 className="text-sm font-bold text-slate-700 mb-3">단체 신청 (가족실)</h3>
                          <GroupTable groups={filtered.filter((g) => g.type === '단체')} password={password} onConfirm={handleConfirm} onPaid={handlePaid} onDelete={handleDelete} onEdit={setEditGroup} />
                        </div>
                      )}
                    </>
                  )
                ) : (
                  <>
                    <h3 className="text-sm font-bold text-slate-700 mb-3">개인 신청</h3>
                    <IndividualTable groups={filtered.filter((g) => g.type === '개인')} password={password} onConfirm={handleConfirm} onPaid={handlePaid} onDelete={handleDelete} onEdit={setEditGroup} />
                    <div className="border-t border-slate-100 mt-6 pt-6">
                      <h3 className="text-sm font-bold text-slate-700 mb-3">단체 신청</h3>
                      <GroupTable groups={filtered.filter((g) => g.type === '단체')} password={password} onConfirm={handleConfirm} onPaid={handlePaid} onDelete={handleDelete} onEdit={setEditGroup} />
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 페이지 ──────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [password, setPassword] = useState<string | null>(null);
  if (!password) return <LoginScreen onLogin={setPassword} />;
  return <Dashboard password={password} onLogout={() => setPassword(null)} />;
}
