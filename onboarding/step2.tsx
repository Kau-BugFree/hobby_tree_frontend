/**
 * O-03 온보딩 2/4 · 예산·시간 (Q04~Q07)
 * - Q04·Q05 ‘직접 금액 입력’, Q06 ‘직접 시간 입력’을 고르면 질문 아래에 입력 칸이 나타나고
 *   입력 시트(O-03-1·O-03-2·O-03-3)가 열린다.
 */
import React from 'react';

import { StepScreen } from '../../components/onboarding/StepScreen';
import { STEP2 } from '../../data/onboarding';

export default function OnboardingStep2() {
  return <StepScreen step={STEP2} next="/onboarding/step3" />;
}
