import { NextRequest, NextResponse } from 'next/server';
import type { FormState } from '@/lib/types';
import { calcSummary } from '@/lib/calculations';
import { DEPT_MAP } from '@/config/pricing';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { sendAlimtalk, TEMPLATE_SUBMIT } from '@/lib/solapi';

const BANK_ACCOUNT = process.env.BANK_ACCOUNT ?? '';

const DEPT_DISPLAY: Record<string, string> = {
  '3진':                    '3진',
  '2진':                    '2진',
  '1진 청년2부':            '청년2부',
  'EM':                     'EM',
  '새가족(셀소속 전)':      '새가족',
  '대학부(UCM)':            'UCM',
  '1진 청년1부':            '청년1부',
  '중고등부(YCM)':          'YCM',
  '초등부(조이랜드)':       '초등부',
  '유치부(40개월~미취학)':  '유치부',
  '베이비(13개월~39개월)':  '베이비',
  '베이비(~12개월)':        '베이비',
};

function memberLabel(name: string, dept: string): string {
  return `${name} (${DEPT_DISPLAY[dept] ?? dept})`;
}

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? '';

const REG_TYPE_KO: Record<string, string> = {
  EARLY: '선등록', REGULAR: '일반등록', ONSITE: '현장등록', DAILY: '일일등록',
};

const VALID_DEPTS = new Set(Object.keys(DEPT_MAP));
const VALID_REG   = new Set(['EARLY', 'REGULAR', 'ONSITE', 'DAILY']);
const VALID_LODGE = new Set(['LODGING', 'NON_LODGING']);
const MAX_COMPANIONS = 10;
const MAX_NAME = 40;

// ── 입력 검증 ────────────────────────────────────────────────────────────
function validate(fs: FormState): string | null {
  if (!fs || (fs.applicationType !== 'INDIVIDUAL' && fs.applicationType !== 'GROUP')) {
    return '신청 유형이 올바르지 않습니다.';
  }
  const rep = fs.representative;
  if (!rep) return '신청자 정보가 없습니다.';
  if (!rep.name?.trim() || rep.name.length > MAX_NAME) return '이름이 올바르지 않습니다.';

  const digits = (rep.phone ?? '').replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 11) return '연락처가 올바르지 않습니다.';

  if (!VALID_DEPTS.has(rep.department as string)) return '소속이 올바르지 않습니다.';
  if (!VALID_REG.has(rep.registrationType)) return '등록 유형이 올바르지 않습니다.';
  if (!VALID_LODGE.has(rep.lodging)) return '숙박 정보가 올바르지 않습니다.';

  const companions = fs.companions ?? [];
  if (!Array.isArray(companions)) return '일행 정보가 올바르지 않습니다.';
  if (companions.length > MAX_COMPANIONS) return '일행 인원이 너무 많습니다.';
  if (fs.applicationType === 'INDIVIDUAL' && companions.length > 0) {
    return '개인 신청에는 일행을 추가할 수 없습니다.';
  }
  for (const c of companions) {
    if (!c.name?.trim() || c.name.length > MAX_NAME) return '일행 이름이 올바르지 않습니다.';
    if (!VALID_DEPTS.has(c.department as string)) return '일행 소속이 올바르지 않습니다.';
    if (!VALID_REG.has(c.registrationType)) return '일행 등록 유형이 올바르지 않습니다.';
    if (!VALID_LODGE.has(c.lodging)) return '일행 숙박 정보가 올바르지 않습니다.';
  }
  return null;
}

function newGroupId(): string {
  // ms 타임스탬프 + 랜덤 4자리 → 동시 제출 충돌 방지
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${ts}-${rand}`;
}

function toRows(formState: FormState): string[][] {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const groupId = newGroupId();
  const appType = formState.applicationType === 'GROUP' ? '단체' : '개인';
  const summary = calcSummary(formState.representative, formState.companions);

  const rep = formState.representative;
  const repItem = summary.items.find((i) => i.isRepresentative);

  const rows: string[][] = [];

  // 대표자 — 금액은 본인 실제 회비(할인 전)
  rows.push([
    groupId, now, appType, '대표자',
    rep.name, rep.phone, rep.department as string, rep.cellGroup ?? '',
    rep.gender ?? '',                              // I 성별
    REG_TYPE_KO[rep.registrationType], rep.dailyDate ?? '',
    rep.lodging === 'LODGING' ? '숙박' : '비숙박',
    rep.wantsFamilyRoom ? '희망' : '',
    String(repItem?.subtotal ?? 0),
    groupId, '', '',
    rep.isYoungUCM ? 'Y' : '',
  ]);

  // 일행 — 각자 실제 회비
  formState.companions.forEach((c) => {
    const item = summary.items.find((i) => i.name === c.name && !i.isRepresentative);
    rows.push([
      groupId, now, appType, '일행',
      c.name, '', c.department as string, c.cellGroup ?? '',
      c.gender ?? '',                              // I 성별
      REG_TYPE_KO[c.registrationType], c.dailyDate ?? '',
      c.lodging === 'LODGING' ? '숙박' : '비숙박',
      '', String(item?.subtotal ?? 0), groupId, '', '',
      c.isYoungUCM ? 'Y' : '',
    ]);
  });

  // 다자녀 할인은 별도 '할인' 행으로 기록한다.
  //  → 구성원 각자의 금액은 실제 회비 그대로 유지되고(가격표·고객화면과 일치),
  //    그룹 합계(행 합)는 할인이 반영되어 고객 화면 총액과 정확히 일치한다.
  if (summary.multiChildDiscountTotal > 0) {
    rows.push([
      groupId, now, appType, '할인',
      `다자녀 할인 ${Math.round(summary.multiChildRate * 100)}%`, '', '', '',
      '', '', '', '', '',                          // 성별·등록유형·참석날짜·숙박·가족실
      String(-summary.multiChildDiscountTotal),   // N 금액 (음수)
      groupId, '', '', '',
    ]);
  }

  return rows;
}

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 500 });
  }

  // ── rate limit: IP당 1분에 8건 ──
  const ip = clientIp(req);
  if (!rateLimit(`submit:${ip}`, 8, 60_000)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  let body: FormState & { _hp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 });
  }

  // ── 허니팟: 봇이 채우는 숨은 필드가 차 있으면 조용히 무시(성공처럼 응답) ──
  if (body._hp) {
    return NextResponse.json({ ok: true });
  }

  // ── 서버측 검증 ──
  const err = validate(body);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const rows = toRows(body);

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ rows }),
  });

  const text = await res.text().catch(() => '');
  console.log('[submit] Apps Script status:', res.status, '| body:', text.slice(0, 500));

  if (!res.ok) {
    // 내부 응답 본문은 클라이언트에 노출하지 않음
    return NextResponse.json({ error: '신청 처리 중 오류가 발생했습니다.' }, { status: 502 });
  }

  try {
    const json = JSON.parse(text);
    if (!json.ok) {
      console.error('[submit] Apps Script returned ok:false:', json);
      return NextResponse.json({ error: '신청 처리 중 오류가 발생했습니다.' }, { status: 502 });
    }
  } catch {
    console.warn('[submit] response is not JSON, treating as success');
  }

  // ── 신청완료 알림톡 (비동기 — 실패해도 신청은 성공) ──
  const rep      = body.representative;
  const summary  = calcSummary(rep, body.companions ?? []);
  const allNames = [
    memberLabel(rep.name, rep.department as string),
    ...(body.companions ?? []).map((c) => memberLabel(c.name, c.department as string)),
  ];

  await sendAlimtalk(rep.phone, TEMPLATE_SUBMIT, {
    '#{이름}':    rep.name,
    '#{등록유형}': REG_TYPE_KO[rep.registrationType] ?? rep.registrationType,
    '#{인원수}':  String(allNames.length),
    '#{구성원}':  allNames.join('\n'),
    '#{금액}':    summary.total.toLocaleString('ko-KR'),
    '#{계좌번호}': BANK_ACCOUNT,
  }).catch((e) => console.error('[alimtalk] submit:', e));

  return NextResponse.json({ ok: true });
}
