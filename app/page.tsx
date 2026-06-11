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
  const [phase, setPhase] = useState<'landing' | 'type' | 'count'>('landing');
  const [formState, setFormState] = useState<FormState>(defaultFormState());
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [feeOpen, setFeeOpen] = useState(false);
  const [groupCount, setGroupCount] = useState<number | null>(null);

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
    setFormState({
      applicationType: type,
      representative: defaultRepresentative(),
      companions: [],
    });
    if (type === 'GROUP') {
      setPhase('count');
    } else {
      // 개인 → 바로 step 2
      setDirection('forward');
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleCountSelect(count: number) {
    setGroupCount(count);
    const companions = Array.from({ length: count - 1 }, () => ({
      id: Math.random().toString(36).slice(2),
      name: '',
      department: '' as const,
      registrationType: formState.representative.registrationType,
      lodging: 'NON_LODGING' as const,
      isRepresentative: false,
    }));
    setFormState((prev) => ({ ...prev, companions }));
    setDirection('forward');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setPhase('landing');
    setGroupCount(null);
    setDirection('forward');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 수양회 정보 배너 */}
      {step === 1 && phase === 'landing' && (
        <>
          {/* 기존 수양회 정보 카드 */}
          <div className="rounded-2xl bg-white border border-slate-200 px-6 py-6 flex flex-col gap-5">
            {/* 태그 + 제목 */}
            <div>
              <span className="inline-block rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-600 mb-3">
                2026 하나가족수양회
              </span>
              <h1 className="text-2xl font-bold text-slate-900 leading-snug">
                "하나 되어 땅 끝까지"
              </h1>
            </div>

            {/* 구분선 */}
            <div className="border-t border-slate-100" />

            {/* 메타 정보 — 토스 스타일 */}
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">일시</p>
                <p className="text-lg font-bold text-slate-900">7월 25일(토) — 26일(주일)</p>
                <p className="text-sm text-slate-500 mt-0.5">오후 1:30 시작 · 오후 5:00 마침</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">장소</p>
                <p className="text-lg font-bold text-slate-900">수원과학대학교 신텍스 &amp; 라비돌</p>
                <p className="text-sm text-slate-500 mt-0.5">경기 화성시 정남면 세자로 286</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 mb-1">강사</p>
                <p className="text-lg font-bold text-slate-900">하나교회 파송 선교사</p>
              </div>
            </div>

            {/* 구분선 */}
            <div className="border-t border-slate-100" />

            {/* 등록기간 */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">등록기간</p>
              <div className="flex flex-col gap-2.5">
                {[
                  { label: '선등록',   period: '~ 07.15(수)' },
                  { label: '일반등록', period: '07.16(목) ~ 07.24(금)' },
                  { label: '현장등록', period: '07.25(토)' },
                  { label: '일일등록', period: '현장 접수 · 하루만 참석' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-700">{item.label}</span>
                    <span className="text-base text-slate-500">{item.period}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 회비 안내 카드 */}
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            {/* 헤더 — 누르면 토글 */}
            <button
              type="button"
              onClick={() => setFeeOpen((v) => !v)}
              className="w-full px-6 py-5 flex items-center justify-between text-left"
            >
              <div>
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-600 mb-2">
                  회비 안내
                </span>
                <p className="text-lg font-bold text-slate-900">참가 회비 확인하기</p>
              </div>
              <svg
                className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${feeOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {feeOpen && (
            <div className="px-6 pb-6 flex flex-col gap-5">
            <div className="border-t border-slate-100" />

            {/* 회비 목록 */}
            <div className="flex flex-col gap-3">

              {/* 성인 */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-bold text-slate-800">3진 · 2진 · 1진 청년2부</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <div className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600 mb-2">비숙박</span>
                    <p className="text-base font-bold text-slate-800">선등록 6만원</p>
                    <p className="text-xs text-slate-400 mt-0.5">일반 6.5만 · 현장 7만</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-2">숙박 1박2일</span>
                    <p className="text-base font-bold text-blue-700">선등록 8만원</p>
                    <p className="text-xs text-slate-400 mt-0.5">일반 8.5만 · 현장 9만</p>
                  </div>
                </div>
              </div>

              {/* UCM · 청년1부 · YCM */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-bold text-slate-800">1진 청년1부 · UCM · YCM <span className="text-xs font-normal text-slate-400">숙박 기본 포함</span></p>
                </div>
                <div className="px-4 py-3 text-center">
                  <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-2">숙박 1박2일</span>
                  <p className="text-base font-bold text-blue-700">선등록 7만 5천원</p>
                  <p className="text-xs text-slate-400 mt-0.5">일반 8만 · 현장 8.5만</p>
                </div>
              </div>

              {/* 초등부 */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-bold text-slate-800">조이랜드 <span className="text-xs font-normal text-slate-400">초등부</span></p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <div className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600 mb-2">비숙박</span>
                    <p className="text-base font-bold text-slate-800">선등록 6만원</p>
                    <p className="text-xs text-slate-400 mt-0.5">일반 6.5만 · 현장 7만</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-2">숙박 1박2일</span>
                    <p className="text-base font-bold text-blue-700">선등록 7만원</p>
                    <p className="text-xs text-slate-400 mt-0.5">일반 7.5만 · 현장 8만</p>
                  </div>
                </div>
              </div>

              {/* 유치부 */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-bold text-slate-800">조이코너 <span className="text-xs font-normal text-slate-400">유치부 · 40개월~미취학</span></p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <div className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600 mb-2">비숙박</span>
                    <p className="text-base font-bold text-slate-800">선등록 4.3만원</p>
                    <p className="text-xs text-slate-400 mt-0.5">일반 4.8만 · 현장 5.3만</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 mb-2">숙박 1박2일</span>
                    <p className="text-base font-bold text-blue-700">선등록 5만원</p>
                    <p className="text-xs text-slate-400 mt-0.5">일반 5.5만 · 현장 6만</p>
                  </div>
                </div>
              </div>

              {/* 영아 */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                  <p className="text-sm font-bold text-slate-800">조이베이비 <span className="text-xs font-normal text-slate-400">영아부</span></p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <div className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600 mb-2">13~39개월</span>
                    <p className="text-base font-bold text-slate-800">선등록 1.5만원</p>
                    <p className="text-xs text-slate-400 mt-0.5">일반 2만 · 현장 2.5만</p>
                  </div>
                  <div className="px-4 py-3 text-center">
                    <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 mb-2">~12개월</span>
                    <p className="text-base font-bold text-emerald-600">무료</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="border-t border-slate-100" />

            {/* 할인 안내 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">다자녀 할인</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">13개월~07년생</span>
              </div>
              <div className="flex flex-col gap-2">
                {[
                  { badge: '자녀 3명 이상', discount: '부모 + 자녀 전원 10% 할인' },
                  { badge: '자녀 4명 이상', discount: '부모 + 자녀 전원 15% 할인' },
                ].map((item) => (
                  <div key={item.badge} className="flex items-center gap-3">
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm font-bold text-emerald-700">{item.badge}</span>
                    <span className="h-px flex-1 bg-slate-100" />
                    <span className="text-sm font-semibold text-emerald-600">{item.discount}</span>
                  </div>
                ))}
              </div>
            </div>
            </div>
            )}
          </div>

          {/* 신청하기 버튼 */}
          <button
            type="button"
            onClick={() => setPhase('type')}
            className="w-full rounded-2xl bg-blue-600 py-4 text-base font-bold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            신청하기 →
          </button>
        </>
      )}

      {/* 유형 선택 (phase: type) */}
      {step === 1 && phase === 'type' && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">어떻게 신청하실 건가요?</h2>
            <p className="mt-1 text-sm text-slate-400">신청 유형을 선택해 주세요.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* 개인 신청 */}
            <button
              type="button"
              onClick={() => handleTypeSelect('INDIVIDUAL')}
              className="flex flex-col items-center rounded-2xl bg-white pt-6 pb-5 px-3 text-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
            >
              <div className="w-full flex items-end justify-center" style={{ height: 100 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img-individual.png"
                  alt="개인 신청"
                  className="object-contain max-h-full"
                  style={{ maxHeight: 100 }}
                  draggable={false}
                />
              </div>
              <div className="mt-4">
                <p className="text-base font-bold text-slate-900">개인 신청</p>
                <div className="mt-2 flex flex-col gap-1 text-left">
                  <p className="text-xs text-slate-400">· 본인 정보만 입력</p>
                  <p className="text-xs text-slate-400">· 빠르고 간단하게</p>
                </div>
              </div>
            </button>
            {/* 단체 신청 */}
            <button
              type="button"
              onClick={() => handleTypeSelect('GROUP')}
              className="flex flex-col items-center rounded-2xl bg-white pt-6 pb-5 px-3 text-center hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
            >
              <div className="w-full flex items-end justify-center" style={{ height: 100 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/img-group.png"
                  alt="단체 신청"
                  className="object-contain max-h-full"
                  style={{ maxHeight: 100 }}
                  draggable={false}
                />
              </div>
              <div className="mt-4">
                <p className="text-base font-bold text-slate-900">단체 신청</p>
                <div className="mt-2 flex flex-col gap-1 text-left">
                  <p className="text-xs text-slate-400">· 대표자가 일행 전원 신청</p>
                  <p className="text-xs text-slate-400">· 합산 금액 한 번에 입금</p>
                </div>
              </div>
            </button>
          </div>
          <button type="button" onClick={() => setPhase('landing')} className="text-sm text-slate-400 text-center py-2">
            ← 돌아가기
          </button>
        </div>
      )}

      {/* 인원 선택 (phase: count, 단체) */}
      {step === 1 && phase === 'count' && (
        <div className="flex flex-col items-center gap-6 py-4 animate-fade-in">
          <div className="w-32 h-32 flex items-end justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/img-group.png"
              alt="가족"
              className="object-contain"
              style={{ maxHeight: 128 }}
              draggable={false}
            />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">본인 포함 몇 명을</h2>
            <h2 className="text-2xl font-bold text-slate-900">등록하시나요?</h2>
            <p className="mt-2 text-sm text-slate-400">대표자 포함 인원을 선택해 주세요</p>
          </div>
          <div className="grid grid-cols-3 gap-3 w-full">
            {[2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleCountSelect(n)}
                className={`rounded-2xl border-2 py-5 text-xl font-bold transition-all active:scale-95
                  ${groupCount === n
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50'
                  }`}
              >
                {n}명
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setPhase('type')} className="text-sm text-slate-400 py-2">
            ← 돌아가기
          </button>
        </div>
      )}

      {/* 스텝 인디케이터 (2단계부터) */}
      {step >= 2 && appType && (
        <StepIndicator current={step} total={maxStep} labels={stepLabels} />
      )}

      {/* 스텝 컨텐츠 */}
      <div key={step} className="animate-fade-in">
        {step === 1 && false && null /* 위에서 직접 렌더 */}

        {step === 2 && (
          <Step2Info
            applicationType={appType!}
            value={formState.representative}
            onChange={updateRepresentative}
            onNext={next}
            onBack={() => {
              setStep(1);
              setPhase(appType === 'GROUP' ? 'count' : 'type');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
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
