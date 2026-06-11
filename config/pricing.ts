// ============================================================
// 2026 하나가족수양회 회비 설정
// 2026 금액 확정 후 PRICING 테이블 수치만 수정하면 됩니다.
// ============================================================

// ── 부서 코드 ─────────────────────────────────────────────
export type Department =
  | 'ADULT_A'    // 성인: 3진, 2진, 청년2부
  | 'ADULT_B'    // 성인: UCM(대학부), 청년1부(1진)  ← 숙박 기본고정
  | 'YCM'        // 중고등부                          ← 숙박 기본고정
  | 'JOYLAND'    // 초등부(조이랜드)
  | 'KINDER'     // 유치부(40개월~미취학)
  | 'BABY_PAID'  // 베이비(13개월~39개월)
  | 'BABY_FREE'; // 베이비(~12개월)  → 무료

// 소속 드롭다운 → 부서 코드 매핑
export const DEPT_MAP: Record<string, Department> = {
  '3진':               'ADULT_A',
  '2진':               'ADULT_A',
  '1진 청년2부':       'ADULT_A',
  'EM':                'ADULT_A',
  '새가족(셀소속 전)': 'ADULT_A',
  '대학부(UCM)':       'ADULT_B',
  '1진 청년1부':       'ADULT_B',
  '중고등부(YCM)':     'YCM',
  '초등부(조이랜드)':  'JOYLAND',
  '유치부(40개월~미취학)': 'KINDER',
  '베이비(13개월~39개월)': 'BABY_PAID',
  '베이비(~12개월)':   'BABY_FREE',
};

// 숙박이 기본고정인 부서 (선택 불가, 항상 LODGING)
export const LODGING_FIXED_DEPTS: Department[] = ['ADULT_B', 'YCM'];

// ── 등록 유형 ─────────────────────────────────────────────
export type RegistrationType = 'EARLY' | 'REGULAR' | 'ONSITE' | 'DAILY';
export type LodgingType = 'NON_LODGING' | 'LODGING';

// 등록 기간 기준 (2026 날짜 확정 후 수정)
// DAILY는 기간 무관 — 신청 시 직접 선택
export const REGISTRATION_PERIODS: Record<
  Exclude<RegistrationType, 'DAILY'>,
  { end: Date }
> = {
  EARLY:   { end: new Date('2026-07-15T23:59:59+09:00') },
  REGULAR: { end: new Date('2026-07-24T23:59:59+09:00') },
  ONSITE:  { end: new Date('2026-07-26T23:59:59+09:00') },
};

export function getRegistrationType(now: Date = new Date()): RegistrationType {
  if (now <= REGISTRATION_PERIODS.EARLY.end)   return 'EARLY';
  if (now <= REGISTRATION_PERIODS.REGULAR.end) return 'REGULAR';
  return 'ONSITE';
}

// 일일등록 날짜 선택지
export const DAILY_DATE_OPTIONS = [
  { label: '7월 25일 (토)', value: '2026-07-25' },
  { label: '7월 26일 (일)', value: '2026-07-26' },
] as const;

// ── 가격표 (2025 기준 세팅 — 2026 확정 후 수치만 교체) ───
// DAILY는 숙박 없음 → NON_LODGING 값만 사용
export type PriceGrid = Record<LodgingType, number>;

export const PRICING: Record<Department, Record<RegistrationType, PriceGrid>> = {
  ADULT_A: {
    EARLY:   { NON_LODGING: 60_000, LODGING: 80_000 },
    REGULAR: { NON_LODGING: 65_000, LODGING: 85_000 },
    ONSITE:  { NON_LODGING: 70_000, LODGING: 90_000 },
    DAILY:   { NON_LODGING: 40_000, LODGING: 40_000 },
  },
  ADULT_B: {
    EARLY:   { NON_LODGING: 55_000, LODGING: 75_000 },
    REGULAR: { NON_LODGING: 65_000, LODGING: 85_000 },
    ONSITE:  { NON_LODGING: 70_000, LODGING: 90_000 },
    DAILY:   { NON_LODGING: 40_000, LODGING: 40_000 },
  },
  YCM: {
    EARLY:   { NON_LODGING: 55_000, LODGING: 75_000 },
    REGULAR: { NON_LODGING: 60_000, LODGING: 80_000 },
    ONSITE:  { NON_LODGING: 65_000, LODGING: 85_000 },
    DAILY:   { NON_LODGING: 35_000, LODGING: 35_000 },
  },
  JOYLAND: {
    EARLY:   { NON_LODGING: 60_000, LODGING: 70_000 },
    REGULAR: { NON_LODGING: 65_000, LODGING: 75_000 },
    ONSITE:  { NON_LODGING: 70_000, LODGING: 80_000 },
    DAILY:   { NON_LODGING: 35_000, LODGING: 35_000 },
  },
  KINDER: {
    EARLY:   { NON_LODGING: 43_000, LODGING: 50_000 },
    REGULAR: { NON_LODGING: 48_000, LODGING: 55_000 },
    ONSITE:  { NON_LODGING: 53_000, LODGING: 60_000 },
    DAILY:   { NON_LODGING: 25_000, LODGING: 25_000 },
  },
  BABY_PAID: {
    EARLY:   { NON_LODGING: 15_000, LODGING: 15_000 },
    REGULAR: { NON_LODGING: 20_000, LODGING: 20_000 },
    ONSITE:  { NON_LODGING: 25_000, LODGING: 25_000 },
    DAILY:   { NON_LODGING: 10_000, LODGING: 10_000 },
  },
  BABY_FREE: {
    EARLY:   { NON_LODGING: 0, LODGING: 0 },
    REGULAR: { NON_LODGING: 0, LODGING: 0 },
    ONSITE:  { NON_LODGING: 0, LODGING: 0 },
    DAILY:   { NON_LODGING: 0, LODGING: 0 },
  },
};

// ── 할인 규칙 ─────────────────────────────────────────────

// 비숙박 할인: 성인A·성인B·YCM만 적용, 1인 20,000원
export const NON_LODGING_DISCOUNT = {
  amount: 20_000,
  eligibleDepts: ['ADULT_A', 'ADULT_B', 'YCM'] as Department[],
};

// 다자녀 할인 (YCM 이하 자녀 기준 — 초등/중고등/유치/영아 모두 포함)
// ① 자녀 3명 이상 → 부모+자녀 전원 10% 할인
// ② 자녀 4명 이상 → 부모+자녀 전원 15% 할인
// 부서 대상: YCM(중고등), JOYLAND(초등/조이랜드), KINDER(유치/조이코너), BABY_PAID(영아/조이베이비)
export const MULTI_CHILD_DISCOUNT = {
  eligibleChildDepts: ['YCM', 'JOYLAND', 'KINDER', 'BABY_PAID'] as Department[],
  tiers: [
    { minChildren: 4, rate: 0.15 },
    { minChildren: 3, rate: 0.10 },
  ],
};

// ── 계산 유틸 ─────────────────────────────────────────────

export interface Attendee {
  department: Department;
  registrationType: RegistrationType;
  lodging: LodgingType;
  isDaily?: boolean;
}

/** 개인 기본 금액 (할인 전) */
export function getBasePrice(attendee: Attendee): number {
  const { department, registrationType, lodging } = attendee;
  return PRICING[department][registrationType][lodging];
}

/** 비숙박 할인 금액 (해당 없으면 0) */
export function getNonLodgingDiscount(attendee: Attendee): number {
  if (attendee.lodging !== 'NON_LODGING') return 0;
  if (!NON_LODGING_DISCOUNT.eligibleDepts.includes(attendee.department)) return 0;
  if (attendee.registrationType === 'DAILY') return 0;
  return NON_LODGING_DISCOUNT.amount;
}

/** 다자녀 할인율 계산 (단체 신청 시 호출) */
export function getMultiChildDiscountRate(children: Attendee[]): number {
  const count = children.filter((c) =>
    MULTI_CHILD_DISCOUNT.eligibleChildDepts.includes(c.department),
  ).length;
  for (const tier of MULTI_CHILD_DISCOUNT.tiers) {
    if (count >= tier.minChildren) return tier.rate;
  }
  return 0;
}
