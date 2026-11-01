/** O-03-1 Q04 직접 금액 입력 (시트 오버레이) */
import React from 'react';

import { AmountSheet } from '../../components/onboarding/InputSheets';
import { useAppState } from '../../lib/appState';

const QUICK = [
  { label: '+1천 원', value: 1000 },
  { label: '+5천 원', value: 5000 },
  { label: '+1만 원', value: 10000 },
  { label: '+5만 원', value: 50000 },
];

export default function AmountQ04Sheet() {
  const { state, update } = useAppState();
  return (
    <AmountSheet
      code="Q04"
      title="첫 활동에 새로 쓸 수 있는 돈"
      help="재료·물품·대여·시설·이동비를 모두 더한 첫 활동의 추가 지출이에요 · 최대 100만 원"
      initial={state.customAmount.q04}
      max={1_000_000}
      quickAdd={QUICK}
      onConfirm={(won) => update({ customAmount: { ...state.customAmount, q04: won } })}
    />
  );
}
