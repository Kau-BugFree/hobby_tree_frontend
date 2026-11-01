/** M-07 개인위치정보 수집·이용 동의 (전문) — 하단 ‘확인’ → BACK(M-04) */
import React from 'react';

import { LegalDocView } from '../../components/my/LegalDocView';
import { TERMS_PERSONAL } from '../../data/terms';

export default function TermsPersonalScreen() {
  return <LegalDocView doc={TERMS_PERSONAL} />;
}
