/** O-04 온보딩 3/4 · 물품·환경 (Q08~Q10) */
import React from 'react';

import { StepScreen } from '../../components/onboarding/StepScreen';
import { STEP3 } from '../../data/onboarding';

export default function OnboardingStep3() {
  return <StepScreen step={STEP3} next="/onboarding/step4" />;
}
