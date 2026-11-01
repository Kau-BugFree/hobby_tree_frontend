import { Redirect } from 'expo-router';
import React from 'react';

/** 앱 첫 진입: 로그인(O-01)부터 시작. 실제 서비스에서는 세션이 있으면 홈 탭으로 보낸다. */
export default function Index() {
  return <Redirect href="/onboarding/login" />;
}
