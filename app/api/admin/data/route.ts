import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? '';
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  ?? '';

// 비밀번호는 URL 쿼리(로그/히스토리에 남음) 대신 헤더로 받는다.
// 구버전 호환을 위해 쿼리도 허용하되 헤더를 우선한다.
function getPassword(req: NextRequest): string {
  return req.headers.get('x-admin-password')
    ?? req.nextUrl.searchParams.get('password')
    ?? '';
}

export async function GET(req: NextRequest) {
  // ── 무차별 대입 방지: IP당 1분 10회 ──
  const ip = clientIp(req);
  if (!rateLimit(`admin:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const pw = getPassword(req);
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 500 });
  }

  const url = `${APPS_SCRIPT_URL}?action=getData&password=${encodeURIComponent(pw)}`;
  const res  = await fetch(url, { redirect: 'follow' });
  const text = await res.text().catch(() => '');

  try {
    const json = JSON.parse(text);
    if (!json.ok) return NextResponse.json({ error: '데이터를 불러오지 못했습니다.' }, { status: 502 });
    return NextResponse.json({ ok: true, rows: json.rows });
  } catch {
    return NextResponse.json({ error: '데이터를 불러오지 못했습니다.' }, { status: 502 });
  }
}
