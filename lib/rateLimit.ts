// 간단한 인메모리 rate limiter.
// (서버리스 환경에서는 인스턴스별로 동작하므로 완벽하진 않지만,
//  대량 스팸/무차별 대입의 1차 방어선으로 충분히 효과적입니다.)

const hits = new Map<string, number[]>();

/**
 * @returns true = 허용, false = 한도 초과(차단)
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const prev = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (prev.length >= limit) {
    hits.set(key, prev);
    return false;
  }
  prev.push(now);
  hits.set(key, prev);
  return true;
}

/** 요청에서 클라이언트 IP 추출 */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}
