import type { Department, RegistrationType, LodgingType } from '@/config/pricing';

export type ApplicationType = 'INDIVIDUAL' | 'GROUP';

export interface AttendeeForm {
  id: string;
  name: string;
  department: Department | '';
  cellGroup?: string;
  registrationType: RegistrationType;
  dailyDate?: '2026-07-25' | '2026-07-26';
  lodging: LodgingType;
  isRepresentative: boolean;
}

export interface RepresentativeForm {
  name: string;
  phone: string;              // 010-xxxx-xxxx
  department: Department | '';
  cellGroup?: string;         // 셀 번호 (1~3진/EM만)
  registrationType: RegistrationType;
  dailyDate?: '2026-07-25' | '2026-07-26';
  lodging: LodgingType;
  wantsFamilyRoom: boolean;   // 가족실 희망 (숙박인 경우만)
}

export interface FormState {
  applicationType: ApplicationType | null;
  representative: RepresentativeForm;
  companions: AttendeeForm[];   // 일행 (단체만)
  // 다자녀 할인은 Step4에서 자동 계산
}

export interface PriceSummaryItem {
  name: string;
  department: Department;
  basePrice: number;         // 선택한 숙박 기준 실제 금액 (= subtotal)
  lodgingBasePrice: number;  // 항상 숙박 기준 금액 (비숙박 할인 표시용 취소선)
  nonLodgingDiscount: number;
  subtotal: number;
  isRepresentative: boolean;
}

export interface PriceSummary {
  items: PriceSummaryItem[];
  multiChildRate: number;
  multiChildDiscountTotal: number;
  total: number;
}

// 소속 드롭다운 목록 (표시 순서)
export const DEPARTMENT_OPTIONS = [
  { label: '3진', value: '3진' },
  { label: '2진', value: '2진' },
  { label: '1진 청년2부', value: '1진 청년2부' },
  { label: '1진 청년1부', value: '1진 청년1부' },
  { label: '대학부(UCM)', value: '대학부(UCM)' },
  { label: '중고등부(YCM)', value: '중고등부(YCM)' },
  { label: '초등부(조이랜드)', value: '초등부(조이랜드)' },
  { label: '유치부(40개월~미취학)', value: '유치부(40개월~미취학)' },
  { label: '베이비(13개월~39개월)', value: '베이비(13개월~39개월)' },
  { label: '베이비(~12개월, 무료)', value: '베이비(~12개월)' },
  { label: 'EM', value: 'EM' },
  { label: '새가족(셀소속 전)', value: '새가족(셀소속 전)' },
] as const;

