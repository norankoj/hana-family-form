import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { sendAlimtalk, TEMPLATE_CONFIRM } from '@/lib/solapi';

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL ?? '';
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD  ?? '';

const VALID_ACTIONS = new Set(['confirm', 'payment']);

// 확정 알림톡에 필요한 그룹 정보 (admin 페이지에서 넘겨줌)
interface ConfirmPayload {
  password:  string;
  groupId:   string;
  action?:   string;
  // 알림톡용 — action=confirm 일 때만 필요
  name?:     string;   // 대표자 이름
  phone?:    string;   // 대표자 연락처
  regType?:  string;   // 등록유형 (한글)
  members?:  string[]; // 전체 구성원 이름 배열
  total?:    number;   // 합계 금액
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`admin:${ip}`, 30, 60_000)) {
    return NextResponse.json({ error: '잠시 후 다시 시도해 주세요.' }, { status: 429 });
  }

  const body: ConfirmPayload = await req.json();
  const { password, groupId, action = 'confirm' } = body;

  if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 틀렸습니다.' }, { status: 401 });
  }
  if (!VALID_ACTIONS.has(action) || !groupId) {
    return NextResponse.json({ error: '요청이 올바르지 않습니다.' }, { status: 400 });
  }
  if (!APPS_SCRIPT_URL) {
    return NextResponse.json({ error: '서버 설정 오류입니다.' }, { status: 500 });
  }

  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, groupId }),
  });
  const text = await res.text().catch(() => '');

  let ok = true;
  try {
    const json = JSON.parse(text);
    if (!json.ok) return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 502 });
  } catch {
    // non-JSON 응답도 성공으로 처리
  }

  if (!ok) return NextResponse.json({ error: '처리 중 오류가 발생했습니다.' }, { status: 502 });

  // ── 확정 알림톡 (action=confirm 일 때만) ──
  if (action === 'confirm' && body.phone && body.name) {
    const members = body.members ?? [body.name];
    sendAlimtalk(body.phone, TEMPLATE_CONFIRM, {
      '#{이름}':    body.name,
      '#{등록유형}': body.regType ?? '',
      '#{인원수}':  String(members.length),
      '#{구성원}':  members.join('\n'),
      '#{금액}':    (body.total ?? 0).toLocaleString('ko-KR'),
    }).catch((e) => console.error('[alimtalk] confirm:', e));
  }

  return NextResponse.json({ ok: true });
}
