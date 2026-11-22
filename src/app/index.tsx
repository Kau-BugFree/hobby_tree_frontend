import { Redirect } from 'expo-router';
import React from 'react';

import { useSession } from '../lib/session';

/**
 * 앱 첫 진입
 * - 저장된 로그인이 없으면 → 로그인(O-01)
 * - 로그인 상태 + 온보딩 미완료(PENDING_ONBOARDING) → 온보딩 1/4
 * - 로그인 상태 + 온보딩 완료 → 홈
 */
export default function Index() {
  const { status, memberStatus } = useSession();
  if (status === 'loading') return null;
  if (status === 'signedOut') return <Redirect href="/onboarding/login" />;
  return <Redirect href={memberStatus === 'ACTIVE' ? '/home' : '/onboarding/step1'} />;
}
