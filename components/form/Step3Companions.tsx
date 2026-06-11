'use client';
import { useState } from 'react';
import type { AttendeeForm, RepresentativeForm } from '@/lib/types';
import { DEPARTMENT_OPTIONS } from '@/lib/types';
import { DEPT_MAP, LODGING_FIXED_DEPTS, getRegistrationType, DAILY_DATE_OPTIONS } from '@/config/pricing';
import Button from '@/components/ui/Button';
import FieldGroup from '@/components/ui/FieldGroup';
import ToggleGroup from '@/components/ui/ToggleGroup';
import InfoBox from '@/components/ui/InfoBox';
import CustomSelect from '@/components/ui/CustomSelect';
import GroupedSelect from '@/components/ui/GroupedSelect';
import PriceTable, { type PriceHighlight } from '@/components/ui/PriceTable';
import { getCellGroups } from '@/lib/cellData';

interface Step3Props {
  representative: RepresentativeForm;
  companions: AttendeeForm[];
  onChange: (companions: AttendeeForm[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function makeCompanion(): AttendeeForm {
  return {
    id: Math.random().toString(36).slice(2),
    name: '',
    department: '',
    registrationType: getRegistrationType(new Date()),
    lodging: 'NON_LODGING',
    isRepresentative: false,
  };
}

function CompanionCard({
  companion,
  index,
  onChange,
  onRemove,
  showError,
}: {
  companion: AttendeeForm;
  index: number;
  onChange: (data: AttendeeForm) => void;
  onRemove: () => void;
  showError: boolean;
}) {
  const dept = DEPT_MAP[companion.department as string];
  const isLodgingFixed = dept ? LODGING_FIXED_DEPTS.includes(dept) : false;
  const autoRegType = getRegistrationType(new Date());

  const registrationTypeLabel: Record<string, string> = {
    EARLY: '선등록', REGULAR: '일반등록', ONSITE: '현장등록', DAILY: '일일등록',
  };

  const cellGroups = getCellGroups(companion.department as string);

  function update<K extends keyof AttendeeForm>(key: K, val: AttendeeForm[K]) {
    const next = { ...companion, [key]: val };
    if (key === 'department') {
      next.cellGroup = '';
      const newDept = DEPT_MAP[val as string];
      if (newDept && LODGING_FIXED_DEPTS.includes(newDept)) {
        next.lodging = 'LODGING';
      }
    }
    onChange(next);
  }

  return (
    <div className="step-card flex flex-col gap-4">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-slate-600">일행 {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          삭제
        </button>
      </div>

      {/* 이름 */}
      <FieldGroup label="이름" required error={showError && !companion.name.trim() ? '이름을 입력해 주세요.' : undefined}>
        <input
          className="form-input"
          type="text"
          placeholder="홍길동"
          value={companion.name}
          onChange={(e) => update('name', e.target.value)}
        />
      </FieldGroup>

      {/* 소속 */}
      <FieldGroup label="소속" required error={showError && !companion.department ? '소속을 선택해 주세요.' : undefined}>
        <CustomSelect
          placeholder="소속을 선택하세요"
          value={companion.department}
          options={DEPARTMENT_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
          onChange={(v) => update('department', v as AttendeeForm['department'])}
        />
      </FieldGroup>

      {/* 셀 번호 */}
      {cellGroups && (
        <FieldGroup label="셀 번호">
          <GroupedSelect
            placeholder="셀 번호 선택 (선택사항)"
            value={companion.cellGroup ?? ''}
            groups={cellGroups}
            onChange={(v) => update('cellGroup', v)}
          />
        </FieldGroup>
      )}

      {/* 등록 유형 */}
      <FieldGroup label="등록 유형">
        <ToggleGroup
          cols={3}
          value={companion.registrationType}
          onChange={(v) => {
            onChange({
              ...companion,
              registrationType: v,
              ...(v !== 'DAILY' ? { dailyDate: undefined } : {}),
              ...(v === 'DAILY' ? { lodging: 'NON_LODGING' } : {}),
            });
          }}
          options={[
            { label: '선등록',  value: 'EARLY',   description: '~ 07.15',     disabled: autoRegType !== 'EARLY' },
            { label: '일반등록', value: 'REGULAR', description: '07.16~07.24', disabled: autoRegType !== 'REGULAR' },
            { label: '일일등록', value: 'DAILY',   description: '당일 참석만' },
          ]}
        />
      </FieldGroup>

      {/* 일일등록 날짜 */}
      {companion.registrationType === 'DAILY' && (
        <FieldGroup
          label="참석 날짜"
          required
          error={showError && !companion.dailyDate ? '날짜를 선택해 주세요.' : undefined}
        >
          <ToggleGroup
            cols={2}
            value={companion.dailyDate ?? ''}
            onChange={(v) => update('dailyDate', v as AttendeeForm['dailyDate'])}
            options={DAILY_DATE_OPTIONS.map((d) => ({ label: d.label, value: d.value }))}
          />
        </FieldGroup>
      )}

      {/* 숙박 여부 */}
      <FieldGroup
        label="숙박 여부"
        hint={isLodgingFixed ? '해당 부서는 숙박이 기본 포함됩니다.' : undefined}
      >
        {isLodgingFixed ? (
          <div className="form-input bg-slate-50 text-slate-500 text-sm">
            숙박 (기본 고정)
          </div>
        ) : (
          <ToggleGroup
            cols={2}
            value={companion.lodging}
            onChange={(v) => update('lodging', v)}
            options={[
              { label: '비숙박', value: 'NON_LODGING', description: '당일 귀가' },
              { label: '숙박', value: 'LODGING', description: '1박 2일' },
            ]}
            disabled={companion.registrationType === 'DAILY'}
          />
        )}
      </FieldGroup>
    </div>
  );
}

export default function Step3Companions({
  representative,
  companions,
  onChange,
  onNext,
  onBack,
}: Step3Props) {
  const [showErrors, setShowErrors] = useState(false);

  function addCompanion() {
    onChange([...companions, makeCompanion()]);
  }

  function updateCompanion(index: number, data: AttendeeForm) {
    onChange(companions.map((c, i) => (i === index ? data : c)));
  }

  function removeCompanion(index: number) {
    onChange(companions.filter((_, i) => i !== index));
  }

  function handleNext() {
    setShowErrors(true);
    const allValid = companions.every(
      (c) =>
        c.name.trim() &&
        c.department &&
        (c.registrationType !== 'DAILY' || c.dailyDate),
    );
    if (allValid) onNext();
  }

  // 하이라이트: 대표자 + 소속/등록유형이 선택된 일행
  const highlights: PriceHighlight[] = [
    ...(representative.department
      ? [{ department: representative.department, registrationType: representative.registrationType, lodging: representative.lodging }]
      : []),
    ...companions
      .filter((c) => c.department)
      .map((c) => ({ department: c.department, registrationType: c.registrationType, lodging: c.lodging })),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">일행을 추가해 주세요</h2>
        <p className="mt-1 text-sm text-slate-500">
          대표자 <strong className="text-slate-700">{representative.name}</strong> 외 함께 신청할 분들을 추가해 주세요.
        </p>
      </div>

      {/* 대표자 요약 */}
      <div className="flex items-center gap-3 rounded-2xl bg-blue-50 border border-blue-100 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold">
          대
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800">{representative.name}</p>
          <p className="text-xs text-blue-500">
            {representative.department} · {representative.lodging === 'LODGING' ? '숙박' : '비숙박'}
          </p>
        </div>
      </div>

      {/* 일행 카드 목록 */}
      {companions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-10 text-slate-400">
          <span className="text-3xl">👥</span>
          <p className="text-sm">아직 추가된 일행이 없어요.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {companions.map((comp, i) => (
            <CompanionCard
              key={comp.id}
              companion={comp}
              index={i}
              onChange={(data) => updateCompanion(i, data)}
              onRemove={() => removeCompanion(i)}
              showError={showErrors}
            />
          ))}
        </div>
      )}

      {/* 일행 추가 버튼 */}
      <button
        type="button"
        onClick={addCompanion}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-blue-300 py-3 text-sm font-medium text-blue-500 hover:bg-blue-50 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        일행 추가
      </button>

      {/* 회비 안내표 */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">회비 안내</p>
        <PriceTable highlights={highlights} />
      </div>

      {/* 다자녀 할인 안내 */}
      {companions.length >= 2 && (
        <InfoBox type="info">
          <p className="font-semibold">다자녀 할인 안내</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            <li>① YCM 이하 자녀(중고등·초등·유치·영아) <strong>3명 이상</strong> → 부모+자녀 전원 <strong>10% 할인</strong></li>
            <li>② YCM 이하 자녀(중고등·초등·유치·영아) <strong>4명 이상</strong> → 부모+자녀 전원 <strong>15% 할인</strong></li>
          </ul>
        </InfoBox>
      )}

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" size="lg" onClick={onBack}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          이전
        </Button>
        <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
          금액 확인
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>
    </div>
  );
}
