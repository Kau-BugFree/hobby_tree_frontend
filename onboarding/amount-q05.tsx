/** O-03-2 Q05 직접 금액 입력 (시트 오버레이) */
import React from 'react';

import { AmountSheet } from '../../components/onboarding/InputSheets';
import { useAppState } from '../../lib/appState';

const QUICK = [
  { label: '+1만 원', value: 10000 },
  { label: '+5만 원', value: 50000 },
  { label: '+10만 원', value: 100000 },
  { label: '+50만 원', value: 500000 },
];

export default function AmountQ05Sheet() {
  const { state, update } = useAppState();
  return (
    <AmountSheet
      code="Q05"
      title="이번 달 취미 전체에 쓸 수 있는 돈"
      help="첫 구매와 반복 비용을 모두 합친 한 달 한도예요 · 최대 300만 원"
      initial={state.customAmount.q05}
      max={3_000_000}
      quickAdd={QUICK}
      onConfirm={(won) => update({ customAmount: { ...state.customAmount, q05: won } })}
    />
  );
}
