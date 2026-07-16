import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? '';
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  ?? '';

interface EditMember {
  이름:     string;
  등록유형: string;
  숙박:     string;
  금액:     number;
  성별:     string;
}

interface EditPayload {
  password:       string;
  groupId:        string;
  members:        EditMember[];
  discountAmount: number;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`admin:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const body: EditPayload = await req.json();
  const { password, groupId, members, discountAmount } = body;

  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }
  if (!groupId || !Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ error: '요청이 올바르지 않습니다.' }, { status: 400 });
  }
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 500 });
  }

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'edit', groupId, members, discountAmount }),
  });

  const text = await res.text().catch(() => '');
  console.log('[edit] Apps Script status:', res.status, '| body:', text.slice(0, 300));

  if (!res.ok) {
    return NextResponse.json({ error: '수정 처리 중 오류가 발생했습니다.' }, { status: 502 });
  }

  try {
    const json = JSON.parse(text);
    if (!json.ok) {
      console.error('[edit] Apps Script returned ok:false:', json);
      return NextResponse.json({ error: json.error ?? '수정 처리 중 오류가 발생했습니다.' }, { status: 502 });
    }
  } catch {
    // non-JSON 응답도 성공으로 처리
  }

  return NextResponse.json({ ok: true });
}
