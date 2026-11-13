/** M-06 위치기반서비스 이용약관 (전문) — 하단 ‘확인’ → BACK(M-04) */
import React from 'react';

import { LegalDocView } from '../../components/my/LegalDocView';
import { TERMS_LOCATION } from '../../data/terms';

export default function TermsLocationScreen() {
  return <LegalDocView doc={TERMS_LOCATION} />;
}
