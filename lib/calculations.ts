import {
  PRICING,
  MULTI_CHILD_DISCOUNT,
  DEPT_MAP,
  type Department,
  type LodgingType,
  type RegistrationType,
} from '@/config/pricing';
import type { RepresentativeForm, AttendeeForm, PriceSummary, PriceSummaryItem } from './types';

function deptCode(deptLabel: string): Department | null {
  return DEPT_MAP[deptLabel] ?? null;
}

function basePrice(dept: Department, regType: RegistrationType, lodging: LodgingType): number {
  return PRICING[dept][regType][lodging];
}

// 비숙박 할인은 PRICING 테이블의 NON_LODGING 금액에 이미 반영됨 (숙박 대비 낮음)
// 별도 할인 금액을 추가 차감하지 않음 → 항상 0
function nonLodgingDiscount(): number {
  return 0;
}

function multiChildRate(companions: AttendeeForm[]): number {
  const childCount = companions.filter((c) => {
    const code = deptCode(c.department as string);
    return code && MULTI_CHILD_DISCOUNT.eligibleChildDepts.includes(code);
  }).length;

  for (const tier of MULTI_CHILD_DISCOUNT.tiers) {
    if (childCount >= tier.minChildren) return tier.rate;
  }
  return 0;
}

export function calcSummary(
  rep: RepresentativeForm,
  companions: AttendeeForm[],
): PriceSummary {
  const items: PriceSummaryItem[] = [];

  const repDept = deptCode(rep.department as string);
  if (repDept) {
    const base = basePrice(repDept, rep.registrationType, rep.lodging);
    const lodgingBase = basePrice(repDept, rep.registrationType, 'LODGING');
    items.push({
      name: rep.name || '대표자',
      department: repDept,
      basePrice: base,
      lodgingBasePrice: lodgingBase,
      nonLodgingDiscount: nonLodgingDiscount(),
      subtotal: base,
      isRepresentative: true,
    });
  }

  for (const comp of companions) {
    const dept = deptCode(comp.department as string);
    if (!dept) continue;
    const base = basePrice(dept, comp.registrationType, comp.lodging);
    const lodgingBase = basePrice(dept, comp.registrationType, 'LODGING');
    items.push({
      name: comp.name || '일행',
      department: dept,
      basePrice: base,
      lodgingBasePrice: lodgingBase,
      nonLodgingDiscount: nonLodgingDiscount(),
      subtotal: base,
      isRepresentative: false,
    });
  }

  const rate = multiChildRate(companions);
  const subtotalSum = items.reduce((s, i) => s + i.subtotal, 0);
  const multiChildDiscountTotal = Math.floor(subtotalSum * rate);
  const total = subtotalSum - multiChildDiscountTotal;

  return { items, multiChildRate: rate, multiChildDiscountTotal, total };
}

export function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}
