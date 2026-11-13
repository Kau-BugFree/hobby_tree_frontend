/** O-02 온보딩 1/4 · 상태·관심·목적 (Q01~Q03) — 세로 스크롤 + 하단 고정 버튼 */
import React from 'react';

import { StepScreen } from '../../components/onboarding/StepScreen';
import { STEP1 } from '../../data/onboarding';

export default function OnboardingStep1() {
  return <StepScreen step={STEP1} next="/onboarding/step2" />;
}
