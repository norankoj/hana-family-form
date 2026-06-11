import { NextRequest, NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? '';
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  ?? '';

export async function POST(req: NextRequest) {
  const { password, groupId, action = 'confirm' } = await req.json();

  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'APPS_SCRIPT_URL 미설정' }, { status: 500 });
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
    if (!json.ok) return NextResponse.json({ error: json.error ?? 'script error' }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
