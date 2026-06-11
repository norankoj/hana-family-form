'use client';
import { useState } from 'react';
import type { FormState } from '@/lib/types';
import { calcSummary, formatKRW } from '@/lib/calculations';
import Button from '@/components/ui/Button';
import InfoBox from '@/components/ui/InfoBox';

interface Step4Props {
  formState: FormState;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  onRestart: () => void;
}

const DEPT_KO: Record<string, string> = {
  ADULT_A: '성인',
  ADULT_B: '성인(UCM/1진)',
  YCM: '중고등부',
  JOYLAND: '초등부',
  KINDER: '유치부',
  BABY_PAID: '베이비',
  BABY_FREE: '베이비(무료)',
};

const REG_TYPE_KO: Record<string, string> = {
  EARLY: '선등록', REGULAR: '일반등록', ONSITE: '현장등록', DAILY: '일일등록',
};

export default function Step4Confirm({ formState, onBack, onSubmit, onRestart }: Step4Props) {
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [done, setDone] = useState(false);

  const summary = calcSummary(formState.representative, formState.companions);
  const rep = formState.representative;

  async function handleSubmit() {
    if (!agreed) return;
    setLoading(true);
    try {
      await onSubmit();
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6 py-8">
        {/* 아이콘 + 제목은 가운데 */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-5xl">
            ✅
          </div>
          <h2 className="text-xl font-bold text-slate-800">하나가족수양회 신청이 완료되었습니다.</h2>
        </div>
        {/* 안내 문구는 좌측 정렬 */}
        <div className="text-sm text-slate-500 leading-relaxed flex flex-col gap-3">
          <p>신청서 내용과 관련하여 확인이 필요한 경우에는 수양회 등록팀에서 연락을 드릴 수 있으니 참고하시기 바랍니다.</p>
          <p>주님의 은혜가 가득한 2026 하나가족 수양회가 되도록 함께 중보해주십시오. 감사합니다.</p>
        </div>

        {/* 입금 안내 */}
        <div className="w-full rounded-2xl bg-blue-50 border border-blue-100 p-5 text-left">
          <p className="text-sm font-bold text-blue-800 mb-3">입금 안내</p>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">입금 금액</span>
              <span className="font-bold text-slate-800">{formatKRW(summary.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">입금 은행</span>
              <span className="font-medium text-slate-800">국민은행</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">계좌번호</span>
              <span className="font-medium text-slate-800">632901-01-454842</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">예금주</span>
              <span className="font-medium text-slate-800">하나교회</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">입금자명</span>
              <span className="font-bold text-blue-700">{rep.name}</span>
            </div>
          </div>
        </div>

        <InfoBox type="warning">
          입금 시 <strong>입금자명을 {rep.name}</strong>으로 해주세요.
          {formState.applicationType === 'GROUP' && (
            <span> 단체 신청의 경우 <strong>대표자 이름</strong>으로 합산 입금해 주세요.</span>
          )}
        </InfoBox>

        <button
          type="button"
          onClick={onRestart}
          className="flex items-center justify-center gap-2 w-full rounded-2xl border-2 border-slate-200 py-3.5 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v5h5" />
          </svg>
          추가 신청하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">신청 내용을 확인해 주세요</h2>
        <p className="mt-1 text-sm text-slate-500">제출 전 금액과 정보를 최종 확인해 주세요.</p>
      </div>

      {/* 신청자 정보 요약 */}
      <div className="step-card flex flex-col gap-3">
        <p className="text-sm font-bold text-slate-600">
          {formState.applicationType === 'GROUP' ? '대표자 정보' : '신청자 정보'}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-slate-500">이름</span>
          <span className="font-medium text-slate-800">{rep.name}</span>
          <span className="text-slate-500">연락처</span>
          <span className="font-medium text-slate-800">{rep.phone}</span>
          <span className="text-slate-500">소속</span>
          <span className="font-medium text-slate-800">{rep.department}</span>
          {rep.cellGroup && (
            <>
              <span className="text-slate-500">셀 번호</span>
              <span className="font-medium text-slate-800">{rep.cellGroup}</span>
            </>
          )}
          <span className="text-slate-500">등록 유형</span>
          <span className="font-medium text-slate-800">
            {REG_TYPE_KO[rep.registrationType]}
            {rep.registrationType === 'DAILY' && rep.dailyDate && ` (${rep.dailyDate.slice(5)})`}
          </span>
          <span className="text-slate-500">숙박</span>
          <span className="font-medium text-slate-800">
            {rep.lodging === 'LODGING' ? '숙박' : '비숙박'}
            {rep.wantsFamilyRoom && ' · 가족실 희망'}
          </span>
        </div>
      </div>

      {/* 금액 내역 */}
      <div className="step-card flex flex-col gap-3">
        <p className="text-sm font-bold text-slate-600">금액 내역</p>

        <div className="flex flex-col gap-2">
          {summary.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {item.isRepresentative && (
                  <span className="badge bg-blue-100 text-blue-600">대표</span>
                )}
                <span className="text-slate-700">
                  {item.name} <span className="text-slate-400 text-xs">({DEPT_KO[item.department]})</span>
                </span>
              </div>
              <div className="text-right">
                {item.lodgingBasePrice > item.subtotal && (
                  <p className="text-xs text-slate-400 line-through">{formatKRW(item.lodgingBasePrice)}</p>
                )}
                <p className="font-medium text-slate-800">{formatKRW(item.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 다자녀 할인 */}
        {summary.multiChildRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600">
              다자녀 할인 ({Math.round(summary.multiChildRate * 100)}%)
            </span>
            <span className="font-medium text-emerald-600">
              -{formatKRW(summary.multiChildDiscountTotal)}
            </span>
          </div>
        )}

        {/* 구분선 */}
        <div className="border-t-2 border-slate-200 pt-3 flex justify-between">
          <span className="font-bold text-slate-800">총 입금액</span>
          <span className="font-bold text-xl text-blue-600">{formatKRW(summary.total)}</span>
        </div>
      </div>

      {/* 입금 안내 */}
      <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-4 text-sm flex flex-col gap-2">
        <p className="font-semibold text-slate-700">입금 계좌</p>
        <p className="text-slate-600">
          국민은행 <strong>632901-01-454842</strong>
        </p>
        <p className="text-slate-600">
          예금주: 하나교회 · 입금자명: <strong className="text-blue-600">{rep.name}</strong>
        </p>
      </div>

      {/* 동의 체크박스 */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            className="sr-only"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <div className={[
            'h-5 w-5 rounded flex items-center justify-center border-2 transition-all',
            agreed ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300',
          ].join(' ')}>
            {agreed && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm text-slate-600 leading-relaxed">
          위 내용을 확인했습니다.
        </span>
      </label>

      {/* 버튼 */}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" size="lg" onClick={onBack} disabled={loading}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          이전
        </Button>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!agreed}
          loading={loading}
          onClick={handleSubmit}
        >
          신청 완료
        </Button>
      </div>
    </div>
  );
}
