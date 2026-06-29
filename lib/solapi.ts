import { createHmac, randomBytes } from 'crypto';

const API_KEY    = process.env.SOLAPI_API_KEY    ?? '';
const API_SECRET = process.env.SOLAPI_API_SECRET ?? '';
const FROM       = process.env.SOLAPI_FROM       ?? '';
const PFID       = process.env.SOLAPI_PFID       ?? '';

export const TEMPLATE_SUBMIT  = process.env.SOLAPI_TEMPLATE_SUBMIT  ?? '';
export const TEMPLATE_CONFIRM = process.env.SOLAPI_TEMPLATE_CONFIRM ?? '';

function authHeader(): string {
  const date      = new Date().toISOString();
  const salt      = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', API_SECRET).update(date + salt).digest('hex');
  return `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * 카카오 알림톡 단건 발송.
 * 환경변수 미설정 시 로그만 남기고 조용히 통과 (신청 흐름을 막지 않음).
 */
export async function sendAlimtalk(
  to: string,
  templateId: string,
  variables: Record<string, string>,
): Promise<void> {
  if (!API_KEY || !API_SECRET || !FROM || !PFID || !templateId) {
    console.warn('[solapi] env var 미설정 — 알림톡 스킵');
    return;
  }

  const phone = to.replace(/\D/g, '');
  if (phone.length < 10) {
    console.warn('[solapi] 전화번호 오류 — 알림톡 스킵:', to);
    return;
  }

  const res = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      message: {
        to: phone,
        from: FROM,
        kakaoOptions: {
          pfId: PFID,
          templateId,
          variables,
        },
      },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('[solapi] 발송 실패:', res.status, txt.slice(0, 300));
  } else {
    console.log('[solapi] 알림톡 발송 완료 →', phone);
  }
}
