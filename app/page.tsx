"use client";
import { useState } from "react";
import type {
  FormState,
  ApplicationType,
  RepresentativeForm,
} from "@/lib/types";
import { getRegistrationType } from "@/config/pricing";
import StepIndicator from "@/components/form/StepIndicator";
import Step1TypeSelect from "@/components/form/Step1TypeSelect";
import Step2Info from "@/components/form/Step2Info";
import Step3Companions from "@/components/form/Step3Companions";
import Step4Confirm from "@/components/form/Step4Confirm";

const defaultRepresentative = (): RepresentativeForm => ({
  name: "",
  phone: "",
  department: "",
  cellGroup: "",
  registrationType: getRegistrationType(new Date()),
  dailyDate: undefined,
  lodging: "NON_LODGING",
  wantsFamilyRoom: false,
});

const defaultFormState = (): FormState => ({
  applicationType: null,
  representative: defaultRepresentative(),
  companions: [],
});

// 개인 신청: 3단계 / 단체 신청: 4단계
function getStepLabels(appType: ApplicationType | null) {
  if (appType === "GROUP") {
    return ["유형 선택", "대표자 정보", "일행 추가", "금액 확인"];
  }
  return ["유형 선택", "신청자 정보", "금액 확인"];
}

// 단체: step 1~4, 개인: step 1~3 (3이 confirm)
function getMaxStep(appType: ApplicationType | null) {
  return appType === "GROUP" ? 4 : 3;
}

// 개인 신청의 경우 step 3이 실제 confirm(단체의 step 4)
function isConfirmStep(step: number, appType: ApplicationType | null) {
  if (appType === "GROUP") return step === 4;
  return step === 3;
}

export default function HomePage() {
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<FormState>(defaultFormState());
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const appType = formState.applicationType;
  const stepLabels = getStepLabels(appType);
  const maxStep = getMaxStep(appType);

  function next() {
    setDirection("forward");
    setStep((s) => Math.min(s + 1, maxStep));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setDirection("back");
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateRepresentative(rep: RepresentativeForm) {
    setFormState((prev) => ({ ...prev, representative: rep }));
  }

  function updateCompanions(companions: FormState["companions"]) {
    setFormState((prev) => ({ ...prev, companions }));
  }

  function handleTypeSelect(type: ApplicationType) {
    setFormState((prev) => {
      if (prev.applicationType === type) return prev;
      return {
        applicationType: type,
        representative: defaultRepresentative(),
        companions: [],
      };
    });
  }

  async function handleSubmit() {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState),
    });
    if (!res.ok) throw new Error('제출 실패');
  }

  function handleRestart() {
    setFormState(defaultFormState());
    setStep(1);
    setDirection('forward');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 수양회 정보 배너 */}
      {step === 1 && (
        <div className="rounded-2xl bg-white border border-slate-200 px-6 py-6 flex flex-col gap-5">
          {/* 태그 + 제목 */}
          <div>
            <span className="inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600 mb-3">
              2026 하나가족수양회
            </span>
            <h1 className="text-xl font-bold text-slate-900 leading-snug">
              "마지막 때에 교회에게 주시는<br />하나님의 사명"
            </h1>
          </div>

          {/* 구분선 */}
          <div className="border-t border-slate-100" />

          {/* 메타 정보 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">📅</span>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5">일정</p>
                <p className="text-sm font-medium text-slate-800">7월 25일(토) ~ 26일(일)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">📍</span>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5">장소</p>
                <p className="text-sm font-medium text-slate-800">수원과학대학교 신텍스(SINTEX) &amp; 라비돌 호텔</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">🎤</span>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5">강사</p>
                <p className="text-sm font-medium text-slate-800">김황신 목사님 (미국 은혜한인교회 EM)</p>
              </div>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-slate-100" />

          {/* 등록기간 */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">등록기간</p>
            <div className="flex flex-col gap-2">
              {[
                { label: '선등록', period: '~ 07.15(수)' },
                { label: '일반등록', period: '07.16(목) ~ 07.24(금)' },
                { label: '현장등록', period: '07.25(토)' },
                { label: '일일등록', period: '현장 접수 · 하루만 참석' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs font-semibold text-slate-500">{item.label}</span>
                  <span className="h-px flex-1 bg-slate-100" />
                  <span className="text-xs text-slate-600">{item.period}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 스텝 인디케이터 (1단계 제외) */}
      {appType && (
        <StepIndicator current={step} total={maxStep} labels={stepLabels} />
      )}

      {/* 스텝 컨텐츠 */}
      <div key={step} className="animate-fade-in">
        {step === 1 && (
          <Step1TypeSelect
            value={appType}
            onChange={handleTypeSelect}
            onNext={next}
          />
        )}

        {step === 2 && (
          <Step2Info
            applicationType={appType!}
            value={formState.representative}
            onChange={updateRepresentative}
            onNext={next}
            onBack={back}
          />
        )}

        {/* 단체 신청: Step 3 = 일행 추가 */}
        {step === 3 && appType === "GROUP" && (
          <Step3Companions
            representative={formState.representative}
            companions={formState.companions}
            onChange={updateCompanions}
            onNext={next}
            onBack={back}
          />
        )}

        {/* 금액 확인 & 제출 */}
        {isConfirmStep(step, appType) && (
          <Step4Confirm
            formState={formState}
            onBack={back}
            onSubmit={handleSubmit}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}
