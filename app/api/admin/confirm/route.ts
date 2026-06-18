import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? '';
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  ?? '';

const VALID_ACTIONS = new Set(['confirm', 'payment']);

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`admin:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const { password, groupId, action = 'confirm' } = await req.json();

  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }
  if (!VALID_ACTIONS.has(action) || !groupId) {
    return NextResponse.json({ error: '요청이 올바르지 않습니다.' }, { status: 400 });
  }
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 500 });
  }

  // action: 'confirm' (확정) | 'payment' (입금확인)
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, groupId }),
  });
  const text = await res.text().catch(() => '');

  try {
    const json = JSON.parse(text);
    if (!json.ok) return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
