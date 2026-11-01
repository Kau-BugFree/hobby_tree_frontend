// 쓰는 굵기만 개별 경로로 불러와 앱 번들에 4개 폰트만 포함 (패키지 루트 import는 9개 굵기 모두 포함)
import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_500Medium } from '@expo-google-fonts/noto-sans-kr/500Medium';
import { NotoSansKR_700Bold } from '@expo-google-fonts/noto-sans-kr/700Bold';
import { NotoSansKR_900Black } from '@expo-google-fonts/noto-sans-kr/900Black';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '../components';
import { AppStateProvider } from '../lib/appState';
import { COLORS } from '../theme';

SplashScreen.preventAutoHideAsync();

/** 오버레이(Figma OVERLAY) — 이전 화면 위에 투명하게 겹쳐 뜨는 라우트 */
const OVERLAY = { presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } } as const;

const OVERLAY_ROUTES = [
  // 온보딩
  'onboarding/amount-q04',
  'onboarding/amount-q05',
  'onboarding/time-q06',
  // 홈
  'home/continue/[hobby]',
  'home/record',
  'home/record-done',
  // 함께
  'together/chat-soon',
  'together/chat-alarm-set',
  'together/coming-soon',
  // MY
  'my/location-consent',
  'my/photo-sheet',
  'my/reset-photo',
  // 챗봇
  'chat/panel',
  // 공통
  'overlay/more',
  'overlay/share',
  'overlay/report',
  'overlay/report-done',
  'overlay/external',
] as const;

export default function RootLayout() {
  const [loaded, error] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
    NotoSansKR_700Bold,
    NotoSansKR_900Black,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <ToastProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.bgApp },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            {OVERLAY_ROUTES.map((name) => (
              <Stack.Screen key={name} name={name} options={OVERLAY} />
            ))}
            <Stack.Screen name="home/growth" options={{ animation: 'fade' }} />
            <Stack.Screen name="home/world-tree" options={{ animation: 'fade' }} />
            <Stack.Screen name="home/planted" options={{ animation: 'fade' }} />
            <Stack.Screen name="onboarding/planted" options={{ animation: 'fade' }} />
            <Stack.Screen name="together/booked" options={{ animation: 'fade' }} />
          </Stack>
        </ToastProvider>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
