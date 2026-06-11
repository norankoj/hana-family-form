'use client';
import { useState, useMemo } from 'react';

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
  confirmed:      boolean;
  paid:           boolean;
}

// ── 부서 통계 맵 ──────────────────────────────────────────────────────────
const DEPT_GROUPS: { label: string; match: (dept: string) => boolean }[] = [
  { label: '3진',       match: (d) => d.includes('3진') },
  { label: '2진',       match: (d) => d.includes('2진') },
  { label: '청년2부',   match: (d) => d.includes('청년2부') },
  { label: '청년1부',   match: (d) => d.includes('청년1부') },
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
      const res = await fetch(`/api/admin/data?password=${encodeURIComponent(pw)}`);
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
          <span className="text-3xl">🔐</span>
          <h1 className="mt-3 text-xl font-bold text-slate-900">관리자 페이지</h1>
          <p className="mt-1 text-sm text-slate-400">2026 하나가족수양회</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호 입력"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
            autoFocus
          />
          {err && <p className="text-xs text-red-500">{err}</p>}
          <button
            type="submit"
            disabled={!pw || loading}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white disabled:opacity-40 hover:bg-blue-700 transition-colors"
          >
            {loading ? '확인 중…' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── 통계 카드 ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'slate' }: {
  label: string; value: number | string; sub?: string; color?: 'slate' | 'blue' | 'amber' | 'emerald';
}) {
  const colorMap = {
    slate:   'bg-slate-50  text-slate-700',
    blue:    'bg-blue-50   text-blue-700',
    amber:   'bg-amber-50  text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className={`rounded-xl px-4 py-3 ${colorMap[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-0.5 text-2xl font-bold">{value}<span className="text-sm font-normal ml-0.5">명</span></p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── 개인 신청 테이블 ──────────────────────────────────────────────────────
function IndividualTable({ groups, password, onConfirm, onPaid }: {
  groups: Group[];
  password: string;
  onConfirm: (groupId: string) => void;
  onPaid: (groupId: string) => void;
}) {
  const individuals = groups.filter((g) => g.type === '개인');
  if (individuals.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">신청 내역이 없습니다.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 text-xs text-slate-500">
            <th className="border border-slate-200 px-3 py-2 text-left whitespace-nowrap">이름</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">연락처</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">소속</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">셀번호</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">등록유형</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">숙박</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">가족실</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">금액</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">신청일시</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">입금확인</th>
            <th className="border border-slate-200 px-3 py-2 whitespace-nowrap">확정</th>
          </tr>
        </thead>
        <tbody>
          {individuals.map((g) => {
            const rep = g.rows[0];
            return (
              <tr key={g.groupId} className={g.confirmed ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'}>
                <td className="border border-slate-200 px-3 py-2 font-medium">{rep.이름}</td>
                <td className="border border-slate-200 px-3 py-2 text-center whitespace-nowrap">{rep.연락처}</td>
                <td className="border border-slate-200 px-3 py-2 text-center whitespace-nowrap">{rep.소속}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{rep.셀번호}</td>
                <td className="border border-slate-200 px-3 py-2 text-center whitespace-nowrap">{rep.등록유형}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${rep.숙박 === '숙박' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                    {rep.숙박}
                  </span>
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center">
                  {rep.가족실 === '희망' ? (
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700">희망</span>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
                <td className="border border-slate-200 px-3 py-2 text-right font-semibold whitespace-nowrap">
                  {Number(rep.금액).toLocaleString()}원
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center text-xs text-slate-400 whitespace-nowrap">{rep.신청일시}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">
                  {g.paid ? (
                    <span className="text-emerald-600 font-bold text-xs">✓ 확인</span>
                  ) : (
                    <PaymentButton groupId={g.groupId} password={password} onPaid={onPaid} />
                  )}
                </td>
                <td className="border border-slate-200 px-3 py-2 text-center">
                  {g.confirmed ? (
                    <span className="text-blue-600 font-bold text-xs">✓ 확정</span>
                  ) : (
                    <ConfirmButton groupId={g.groupId} password={password} onConfirm={onConfirm} />
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── 단체 신청 테이블 ──────────────────────────────────────────────────────
function GroupTable({ groups, password, onConfirm, onPaid }: {
  groups: Group[];
  password: string;
  onConfirm: (groupId: string) => void;
  onPaid: (groupId: string) => void;
}) {
  const groupOnes = groups.filter((g) => g.type === '단체');
  if (groupOnes.length === 0) return <p className="text-sm text-slate-400 py-6 text-center">신청 내역이 없습니다.</p>;

  return (
    <div className="flex flex-col gap-4">
      {groupOnes.map((g) => {
        const rep   = g.rows.find((r) => r.구분 === '대표자') ?? g.rows[0];
        const total = g.rows.reduce((s, r) => s + Number(r.금액 || 0), 0);
        return (
          <div key={g.groupId} className={`rounded-xl border overflow-hidden ${g.confirmed ? 'border-emerald-300' : 'border-slate-200'}`}>
            {/* 그룹 헤더 */}
            <div className={`flex items-center justify-between px-4 py-3 ${g.confirmed ? 'bg-emerald-50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-mono text-slate-400">{g.groupId}</span>
                <span className="font-bold text-slate-900">{rep.이름} 외 {g.rows.length - 1}명</span>
                {rep.가족실 === '희망' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                    🛏 가족실 희망
                  </span>
                )}
                <span className="text-xs text-slate-500">{rep.신청일시}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-700 mr-1">{total.toLocaleString()}원</span>
                {g.paid ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">✓ 입금</span>
                ) : (
                  <PaymentButton groupId={g.groupId} password={password} onPaid={onPaid} />
                )}
                {g.confirmed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">✓ 확정</span>
                ) : (
                  <ConfirmButton groupId={g.groupId} password={password} onConfirm={onConfirm} />
                )}
              </div>
            </div>
            {/* 멤버 목록 */}
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-xs text-slate-400 bg-white border-b border-slate-100">
                  <th className="px-4 py-1.5 text-left">구분</th>
                  <th className="px-4 py-1.5 text-left">이름</th>
                  <th className="px-4 py-1.5">소속</th>
                  <th className="px-4 py-1.5">등록유형</th>
                  <th className="px-4 py-1.5">숙박</th>
                  <th className="px-4 py-1.5">가족실</th>
                  <th className="px-4 py-1.5 text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${row.구분 === '대표자' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {row.구분}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">{row.이름}</td>
                    <td className="px-4 py-2 text-center text-slate-600 whitespace-nowrap">{row.소속}</td>
                    <td className="px-4 py-2 text-center text-slate-600 whitespace-nowrap">{row.등록유형}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${row.숙박 === '숙박' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {row.숙박}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {row.가족실 === '희망' ? (
                        <span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700">희망</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">{Number(row.금액).toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ── 확정 버튼 ──────────────────────────────────────────────────────────────
function ConfirmButton({ groupId, password, onConfirm }: {
  groupId: string;
  password: string;
  onConfirm: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!confirm('이 신청을 확정하시겠습니까?\n(카카오톡 알림이 발송됩니다)')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, groupId, action: 'confirm' }),
      });
      if (res.ok) onConfirm(groupId);
      else alert('확정 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {loading ? '처리중…' : '확정'}
    </button>
  );
}

// ── 입금확인 버튼 ──────────────────────────────────────────────────────────
function PaymentButton({ groupId, password, onPaid }: {
  groupId: string;
  password: string;
  onPaid: (id: string) => void;
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {loading ? '처리중…' : '입금확인'}
    </button>
  );
}

// ── 메인 대시보드 ──────────────────────────────────────────────────────────
function Dashboard({ password, onLogout }: { password: string; onLogout: () => void }) {
  const [rows, setRows]     = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [tab, setTab]       = useState<'all' | 'individual' | 'group'>('all');
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [paid, setPaid]           = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/data?password=${encodeURIComponent(password)}`);
      const json = await res.json();
      if (!json.ok) { setError(json.error ?? '오류'); return; }
      setRows(json.rows ?? []);
      // 시트에서 확정된 항목 반영
      const confirmedIds = new Set<string>(
        json.rows.filter((r: Row) => r.확정 === '확정').map((r: Row) => r.groupId)
      );
      const paidIds = new Set<string>(
        json.rows.filter((r: Row) => r.입금확인 === '확인').map((r: Row) => r.groupId)
      );
      setConfirmed(confirmedIds);
      setPaid(paidIds);
    } catch {
      setError('데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // 첫 로드
  useState(() => { load(); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => { load(); }, []);

  // rows → groups
  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Row[]>();
    rows.forEach((r) => {
      const key = r.groupId || r.이름;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });
    return Array.from(map.entries()).map(([id, rs]) => ({
      groupId:   id,
      type:      rs[0].신청유형,
      rows:      rs,
      confirmed: confirmed.has(id),
      paid:      paid.has(id),
    }));
  }, [rows, confirmed, paid]);

  // 통계
  const totalPeople  = rows.length;
  const lodgingCount = rows.filter((r) => r.숙박 === '숙박').length;
  const nonLodging   = totalPeople - lodgingCount;
  const deptStats    = calcDeptStats(rows);
  const confirmedCnt = groups.filter((g) => g.confirmed).length;

  function handleConfirm(groupId: string) {
    setConfirmed((prev) => new Set([...prev, groupId]));
  }

  function handlePaid(groupId: string) {
    setPaid((prev) => new Set([...prev, groupId]));
  }

  const tabGroups = tab === 'all' ? groups
    : tab === 'individual' ? groups.filter((g) => g.type === '개인')
    : groups.filter((g) => g.type === '단체');

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-screen-2xl mx-auto px-8 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-blue-600 font-semibold">관리자</p>
            <p className="text-base font-bold text-slate-900">2026 하나가족수양회</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={load}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115 0M20 15a9 9 0 01-15 0" />
              </svg>
              새로고침
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-8 py-6 flex flex-col gap-6">

        {/* 오류 */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="text-center py-16 text-slate-400 text-sm">불러오는 중…</div>
        )}

        {!loading && !error && (
          <>
            {/* 통계 + 부서별 — PC에서 한 줄 */}
            <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-4 items-start">

              {/* 요약 카드 4개 */}
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">요약</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-3 xl:w-64">
                  <StatCard label="총 신청 인원" value={totalPeople} color="slate" />
                  <StatCard label="숙박" value={lodgingCount} color="blue" />
                  <StatCard label="비숙박" value={nonLodging} color="amber" />
                  <StatCard label="확정 완료" value={confirmedCnt} sub={`/ ${groups.length}건`} color="emerald" />
                </div>
              </div>

              {/* 부서별 통계 */}
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">부서별 현황</h2>
                <div className="grid grid-cols-5 lg:grid-cols-9 gap-2">
                  {deptStats.map(({ label, count }) => (
                    <div key={label} className="rounded-xl bg-white border border-slate-200 px-3 py-3 text-center">
                      <p className="text-xs text-slate-500 font-medium whitespace-nowrap">{label}</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{count}</p>
                      <p className="text-xs text-slate-400">명</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 탭 */}
            <div>
              <div className="flex gap-2 mb-4">
                {([
                  { key: 'all',        label: `전체 (${groups.length})` },
                  { key: 'individual', label: `개인 (${groups.filter(g=>g.type==='개인').length})` },
                  { key: 'group',      label: `단체 (${groups.filter(g=>g.type==='단체').length})` },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                      tab === key ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 테이블 */}
              <div className="rounded-xl bg-white border border-slate-200 overflow-hidden p-4">
                {(tab === 'all' || tab === 'individual') && (
                  <>
                    {(tab === 'all') && (
                      <h3 className="text-sm font-bold text-slate-700 mb-3">개인 신청</h3>
                    )}
                    <IndividualTable
                      groups={tabGroups.filter(g => g.type === '개인')}
                      password={password}
                      onConfirm={handleConfirm}
                      onPaid={handlePaid}
                    />
                  </>
                )}

                {tab === 'all' && (
                  <div className="border-t border-slate-100 mt-6 pt-6">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">단체 신청</h3>
                    <GroupTable
                      groups={tabGroups.filter(g => g.type === '단체')}
                      password={password}
                      onConfirm={handleConfirm}
                      onPaid={handlePaid}
                    />
                  </div>
                )}

                {tab === 'group' && (
                  <GroupTable
                    groups={tabGroups}
                    password={password}
                    onConfirm={handleConfirm}
                    onPaid={handlePaid}
                  />
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

  if (!password) {
    return <LoginScreen onLogin={setPassword} />;
  }
  return <Dashboard password={password} onLogout={() => setPassword(null)} />;
}
