import { NextRequest, NextResponse } from 'next/server';
import type { FormState } from '@/lib/types';
import { calcSummary } from '@/lib/calculations';
import { DEPT_MAP } from '@/config/pricing';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? '';

const REG_TYPE_KO: Record<string, string> = {
  EARLY: '선등록', REGULAR: '일반등록', ONSITE: '현장등록', DAILY: '일일등록',
};

function toRows(formState: FormState): string[][] {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const groupId = Date.now().toString(36).toUpperCase();
  const appType = formState.applicationType === 'GROUP' ? '단체' : '개인';
  const summary = calcSummary(formState.representative, formState.companions);

  const rows: string[][] = [];

  // 대표자/신청자 행
  const rep = formState.representative;
  const repItem = summary.items.find((i) => i.isRepresentative);
  rows.push([
    groupId,                                          // A 신청번호
    now,                                              // B 신청일시
    appType,                                          // C 신청유형
    '대표자',                                          // D 구분
    rep.name,                                         // E 이름
    rep.phone,                                        // F 연락처
    rep.department,                                   // G 소속
    rep.cellGroup ?? '',                              // H 셀번호
    REG_TYPE_KO[rep.registrationType],                // I 등록유형
    rep.dailyDate ?? '',                              // J 참석날짜
    rep.lodging === 'LODGING' ? '숙박' : '비숙박',    // K 숙박
    rep.wantsFamilyRoom ? '희망' : '',                // L 가족실
    String(repItem?.subtotal ?? 0),                   // M 금액
    groupId,                                          // N 그룹ID
  ]);

  // 일행 행
  formState.companions.forEach((c) => {
    const item = summary.items.find((i) => i.name === c.name && !i.isRepresentative);
    rows.push([
      groupId,
      now,
      appType,
      '일행',
      c.name,
      '',                                             // 연락처 없음
      c.department,
      c.cellGroup ?? '',
      REG_TYPE_KO[c.registrationType],
      c.dailyDate ?? '',
      c.lodging === 'LODGING' ? '숙박' : '비숙박',
      '',                                             // 가족실 해당 없음
      String(item?.subtotal ?? 0),
      groupId,
    ]);
  });

  return rows;
}

export async function POST(req: NextRequest) {
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'APPS_SCRIPT_URL 환경변수가 설정되지 않았습니다.' }, { status: 500 });
  }

  const formState: FormState = await req.json();

  const rows = toRows(formState);

  // Apps Script는 POST /exec → 302 /echo 흐름.
  // redirect:'follow' 로 /echo 까지 따라가면 실제 응답 JSON을 읽을 수 있음.
  // (스크립트는 /exec 단계에서 이미 실행되므로 redirect가 GET이어도 무관)
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ rows }),
  });

  const text = await res.text().catch(() => '');
  console.log('[submit] Apps Script status:', res.status, '| body:', text.slice(0, 500));

  if (!res.ok) {
    return NextResponse.json({ error: 'Apps Script 오류', status: res.status, body: text.slice(0, 200) }, { status: 502 });
  }

  // 응답 JSON에서 ok 확인
  try {
    const json = JSON.parse(text);
    if (!json.ok) {
      console.error('[submit] Apps Script returned ok:false:', json);
      return NextResponse.json({ error: json.error ?? 'script error' }, { status: 502 });
    }
  } catch {
    // JSON이 아닌 응답이면 그냥 성공으로 간주
    console.warn('[submit] response is not JSON, treating as success');
  }

  return NextResponse.json({ ok: true });
}
