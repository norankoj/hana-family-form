import { NextRequest, NextResponse } from 'next/server';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? '';
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  ?? '';

export async function GET(req: NextRequest) {
  const pw = req.nextUrl.searchParams.get('password') ?? '';
  if (!ADMIN_PASSWORD || pw !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: 'APPS_SCRIPT_URL 미설정' }, { status: 500 });
  }

  const url = `${APPS_SCRIPT_URL}?action=getData&password=${encodeURIComponent(pw)}`;
  const res  = await fetch(url, { redirect: 'follow' });
  const text = await res.text().catch(() => '');

  try {
    const json = JSON.parse(text);
    if (!json.ok) return NextResponse.json({ error: json.error ?? 'script error' }, { status: 502 });
    return NextResponse.json({ ok: true, rows: json.rows });
  } catch {
    return NextResponse.json({ error: '응답 파싱 오류', raw: text.slice(0, 300) }, { status: 502 });
  }
}
