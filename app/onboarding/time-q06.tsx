/** O-03-3 Q06 직접 시간 입력 (시트 오버레이) */
import React from 'react';

import { TimeSheet } from '../../components/onboarding/InputSheets';
import { useAppState } from '../../lib/appState';

export default function TimeQ06Sheet() {
  const { state, update } = useAppState();
  return <TimeSheet initialMinutes={state.customMinutes} onConfirm={(m) => update({ customMinutes: m })} />;
}
