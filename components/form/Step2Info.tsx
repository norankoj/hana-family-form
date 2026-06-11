"use client";
import { useState, useEffect } from "react";
import type { RepresentativeForm, ApplicationType } from "@/lib/types";
import { DEPARTMENT_OPTIONS } from "@/lib/types";
import {
  DEPT_MAP,
  LODGING_FIXED_DEPTS,
  NON_LODGING_DISCOUNT,
  getRegistrationType,
  DAILY_DATE_OPTIONS,
} from "@/config/pricing";
import { getCellGroups } from "@/lib/cellData";
import { formatPhone } from "@/lib/calculations";
import Button from "@/components/ui/Button";
import FieldGroup from "@/components/ui/FieldGroup";
import ToggleGroup from "@/components/ui/ToggleGroup";
import InfoBox from "@/components/ui/InfoBox";
import CustomSelect from "@/components/ui/CustomSelect";
import GroupedSelect from "@/components/ui/GroupedSelect";

interface Step2Props {
  applicationType: ApplicationType;
  value: RepresentativeForm;
  onChange: (data: RepresentativeForm) => void;
  onNext: () => void;
  onBack: () => void;
}

interface Errors {
  name?: string;
  phone?: string;
  department?: string;
  dailyDate?: string;
}

function validate(data: RepresentativeForm): Errors {
  const errors: Errors = {};
  if (!data.name.trim()) errors.name = "이름을 입력해 주세요.";
  const digits = data.phone.replace(/\D/g, "");
  if (!digits) errors.phone = "연락처를 입력해 주세요.";
  else if (digits.length < 10) errors.phone = "올바른 연락처를 입력해 주세요.";
  if (!data.department) errors.department = "소속을 선택해 주세요.";
  if (data.registrationType === "DAILY" && !data.dailyDate) {
    errors.dailyDate = "참석 날짜를 선택해 주세요.";
  }
  return errors;
}

export default function Step2Info({
  applicationType,
  value,
  onChange,
  onNext,
  onBack,
}: Step2Props) {
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);

  const dept = DEPT_MAP[value.department as string];
  const isLodgingFixed = dept ? LODGING_FIXED_DEPTS.includes(dept) : false;
  const isNonLodgingDiscountEligible =
    dept &&
    value.lodging === "NON_LODGING" &&
    NON_LODGING_DISCOUNT.eligibleDepts.includes(dept);

  const autoRegType = getRegistrationType(new Date());
  const cellGroups = getCellGroups(value.department as string);
  const showCellGroup = !!cellGroups;

  useEffect(() => {
    if (isLodgingFixed) {
      onChange({ ...value, lodging: "LODGING" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.department]);

  function update<K extends keyof RepresentativeForm>(
    key: K,
    val: RepresentativeForm[K],
  ) {
    onChange({ ...value, [key]: val });
  }

  function handleNext() {
    setTouched(true);
    const errs = validate(value);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onNext();
  }

  const registrationTypeLabel: Record<string, string> = {
    EARLY: "선등록",
    REGULAR: "일반등록",
    ONSITE: "현장등록",
    DAILY: "일일등록",
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">
          {applicationType === "GROUP"
            ? "대표자 정보를 입력해 주세요"
            : "신청자 정보를 입력해 주세요"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {applicationType === "GROUP"
            ? "대표자 이름으로 합산 금액을 입금해 주세요."
            : "본인 정보를 입력해 주세요."}
        </p>
      </div>

      {/* 이름 */}
      <FieldGroup
        label="이름"
        required
        error={touched ? errors.name : undefined}
      >
        <input
          className="form-input"
          type="text"
          placeholder="홍길동"
          value={value.name}
          onChange={(e) => update("name", e.target.value)}
        />
      </FieldGroup>

      {/* 연락처 */}
      <FieldGroup
        label="연락처"
        required
        error={touched ? errors.phone : undefined}
      >
        <input
          className="form-input"
          type="tel"
          inputMode="numeric"
          placeholder="010-0000-0000"
          value={value.phone}
          onChange={(e) => update("phone", formatPhone(e.target.value))}
          maxLength={13}
        />
      </FieldGroup>

      {/* 소속 */}
      <FieldGroup
        label="소속"
        required
        error={touched ? errors.department : undefined}
      >
        <CustomSelect
          placeholder="소속을 선택하세요"
          value={value.department}
          options={DEPARTMENT_OPTIONS.map((o) => ({
            label: o.label,
            value: o.value,
          }))}
          onChange={(v) =>
            onChange({
              ...value,
              department: v as RepresentativeForm["department"],
              cellGroup: "",
            })
          }
        />
      </FieldGroup>

      {/* 셀 번호 */}
      {showCellGroup && cellGroups && (
        <FieldGroup label="셀 번호">
          <GroupedSelect
            placeholder="셀 번호 선택 (선택사항)"
            value={value.cellGroup ?? ""}
            groups={cellGroups}
            onChange={(v) => update("cellGroup", v)}
          />
        </FieldGroup>
      )}

      {/* 등록 유형 */}
      <FieldGroup label="등록 유형">
        <ToggleGroup
          cols={3}
          value={value.registrationType}
          onChange={(v) => {
            onChange({
              ...value,
              registrationType: v,
              ...(v !== "DAILY" ? { dailyDate: undefined } : {}),
              // 일일등록 선택 시 숙박 → 비숙박 강제, 가족실 초기화
              ...(v === "DAILY"
                ? { lodging: "NON_LODGING", wantsFamilyRoom: false }
                : {}),
            });
          }}
          options={[
            {
              label: "선등록",
              value: "EARLY",
              description: "~ 07.15",
              disabled: autoRegType !== "EARLY",
            },
            {
              label: "일반등록",
              value: "REGULAR",
              description: "07.16~07.24",
              disabled: autoRegType !== "REGULAR",
            },
            { label: "일일등록", value: "DAILY", description: "당일 참석만" },
          ]}
        />
      </FieldGroup>

      {/* 일일등록 날짜 */}
      {value.registrationType === "DAILY" && (
        <FieldGroup
          label="참석 날짜"
          required
          error={touched ? errors.dailyDate : undefined}
        >
          <ToggleGroup
            cols={2}
            value={value.dailyDate ?? ""}
            onChange={(v) =>
              update("dailyDate", v as RepresentativeForm["dailyDate"])
            }
            options={DAILY_DATE_OPTIONS.map((d) => ({
              label: d.label,
              value: d.value,
            }))}
          />
        </FieldGroup>
      )}

      {/* 숙박 여부 */}
      <FieldGroup
        label="숙박 여부"
        hint={
          isLodgingFixed ? "해당 부서는 숙박이 기본 포함됩니다." : undefined
        }
      >
        {isLodgingFixed ? (
          <div className="form-input bg-slate-50 text-slate-500 text-sm">
            숙박 (기본 고정)
          </div>
        ) : (
          <ToggleGroup
            cols={2}
            value={value.lodging}
            onChange={(v) => update("lodging", v)}
            options={[
              {
                label: "비숙박",
                value: "NON_LODGING",
                description: "당일 귀가",
              },
              { label: "숙박", value: "LODGING", description: "1박 2일" },
            ]}
            disabled={value.registrationType === "DAILY"}
          />
        )}
      </FieldGroup>

      {/* 비숙박 할인 안내 */}
      {isNonLodgingDiscountEligible && value.registrationType !== "DAILY" && (
        <InfoBox type="success">비숙박 할인 20,000원이 적용됩니다.</InfoBox>
      )}

      {/* 가족실 희망 — 단체 신청 + 숙박인 경우만 표시 */}
      {applicationType === "GROUP" && value.lodging === "LODGING" && (
        <FieldGroup label="가족실 희망 (준비팀에서 검토 후 개별 문자 드립니다)">
          <ToggleGroup
            cols={2}
            value={value.wantsFamilyRoom ? "yes" : "no"}
            onChange={(v) => update("wantsFamilyRoom", v === "yes")}
            options={[
              { label: "희망하지 않음", value: "no" },
              { label: "희망함", value: "yes" },
            ]}
          />
          <div className="mt-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-600 leading-relaxed">
            <p>
              방 배정은 기본 <strong>1실 8인</strong> 기준으로 형제·자매
              구분하여 배정됩니다.
            </p>
            <p className="mt-1.5">
              2~6인 가족실이 필요한 경우 방 별로{" "}
              <strong>2~4만 원의 추가 요금</strong>이 발생합니다.
            </p>
            <p className="mt-1.5 text-slate-400">
              숙소 여건상 객실이 부족할 경우 배정이 제한될 수 있으니 미리 양해
              부탁드립니다.
            </p>
          </div>
        </FieldGroup>
      )}

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" size="lg" onClick={onBack}>
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          이전
        </Button>
        <Button variant="primary" size="lg" fullWidth onClick={handleNext}>
          {applicationType === "GROUP" ? "일행 추가" : "금액 확인"}
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
