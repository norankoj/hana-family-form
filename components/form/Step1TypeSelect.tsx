'use client';
import type { ApplicationType } from '@/lib/types';
import Button from '@/components/ui/Button';
import InfoBox from '@/components/ui/InfoBox';

interface Step1Props {
  value: ApplicationType | null;
  onChange: (type: ApplicationType) => void;
  onNext: () => void;
}

const options: {
  type: ApplicationType;
  icon: string;
  title: string;
  subtitle: string;
  details: string[];
}[] = [
  {
    type: 'INDIVIDUAL',
    icon: '🙋',
    title: '개인 신청',
    subtitle: '혼자 또는 개별 신청',
    details: ['본인 정보만 입력', '빠르고 간단하게'],
  },
  {
    type: 'GROUP',
    icon: '👨‍👩‍👧‍👦',
    title: '단체 신청',
    subtitle: '가족 · 셀 함께',
    details: ['대표자가 일행 전원 신청', '합산 금액으로 한 번에 입금'],
  },
];

export default function Step1TypeSelect({ value, onChange, onNext }: Step1Props) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">신청 유형을 선택해 주세요</h2>
        <p className="mt-1 text-sm text-slate-500">
          가족이나 셀원이 함께 신청하는 경우 단체 신청을 선택하세요.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {options.map((opt) => {
          const selected = value === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => onChange(opt.type)}
              className={[
                'flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-all',
                selected
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50',
              ].join(' ')}
            >
              {/* 선택 인디케이터 */}
              <div
                className={[
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  selected ? 'border-blue-500 bg-blue-500' : 'border-slate-300',
                ].join(' ')}
              >
                {selected && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>

              {/* 아이콘 */}
              <span className="text-3xl">{opt.icon}</span>

              {/* 텍스트 */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-base ${selected ? 'text-blue-700' : 'text-slate-800'}`}>
                    {opt.title}
                  </span>
                  <span className={`text-xs ${selected ? 'text-blue-500' : 'text-slate-400'}`}>
                    {opt.subtitle}
                  </span>
                </div>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {opt.details.map((d) => (
                    <li key={d} className={`text-xs ${selected ? 'text-blue-600' : 'text-slate-500'}`}>
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          );
        })}
      </div>

      {value === 'GROUP' && (
        <InfoBox type="info">
          <p>
            단체 신청 시 <strong>대표자 이름</strong>으로 합산 금액을 입금해 주세요.
          </p>
          <p className="mt-1">
            다자녀 할인(자녀 3명 이상)은 단체 신청에서만 적용됩니다.
          </p>
        </InfoBox>
      )}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!value}
        onClick={onNext}
      >
        다음
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Button>
    </div>
  );
}
