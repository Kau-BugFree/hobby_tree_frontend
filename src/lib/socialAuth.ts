import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { Provider } from '../api/types';

/**
 * 소셜 SDK 로그인 → 제공자 토큰 받기
 * 명세(API-01): "클라이언트가 소셜 SDK로 받은 토큰을 보낸다. 백엔드 리다이렉트 방식은 사용하지 않는다."
 *   - KAKAO: 카카오 Access Token  (@react-native-seoul/kakao-login → login())
 *   - GOOGLE: 구글 ID Token       (@react-native-google-signin/google-signin → GoogleSignin.signIn())
 *
 * 동작 순서
 *   1) 개발용 빌드(npx expo run:android) · 실제 앱 → SDK 로그인 창이 떠서 토큰을 자동으로 받는다
 *   2) Expo Go · 웹(SDK 없음) + 개발 모드 → .env.local 의 EXPO_PUBLIC_DEV_KAKAO_TOKEN / EXPO_PUBLIC_DEV_GOOGLE_TOKEN
 *   3) 둘 다 아니면 SocialSdkUnavailableError → 로그인 화면이 '체험 모드'로 넘어간다
 * 토큰은 로그로 남기지 않는다.
 */
export class SocialSdkUnavailableError extends Error {
  constructor(readonly provider: Provider) {
    super(`${provider} SDK가 아직 연결되지 않았어요`);
    this.name = 'SocialSdkUnavailableError';
  }
}

/** 사용자가 로그인 창을 닫음 — 화면에 오류를 띄우지 않는다 */
export class SocialLoginCancelledError extends Error {
  constructor(readonly provider: Provider) {
    super('로그인을 취소했어요');
    this.name = 'SocialLoginCancelledError';
  }
}

/** Expo Go(스토어 클라이언트)·웹에는 SDK 네이티브 코드가 없다 */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const nativeSdkAvailable = Platform.OS !== 'web' && !isExpoGo;

const DEV_TOKENS: Record<Provider, string | undefined> = {
  KAKAO: process.env.EXPO_PUBLIC_DEV_KAKAO_TOKEN,
  GOOGLE: process.env.EXPO_PUBLIC_DEV_GOOGLE_TOKEN,
};

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

/* ── 카카오 ── */
async function kakaoAccessToken(): Promise<string> {
  // SDK 모듈은 Expo Go에서 불러오면 멈추므로, 쓸 때만 불러온다
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Kakao = require('@react-native-seoul/kakao-login') as typeof import('@react-native-seoul/kakao-login');
  try {
    // 카카오톡이 설치돼 있으면 카카오톡으로, 없으면 카카오 계정 웹 로그인으로
    const token = await Kakao.login();
    if (!token?.accessToken) throw new Error('카카오 토큰을 받지 못했어요');
    return token.accessToken;
  } catch (e) {
    const code = (e as { code?: string })?.code ?? '';
    const msg = String((e as { message?: string })?.message ?? '');
    if (code.includes('CANCEL') || /cancel/i.test(msg)) throw new SocialLoginCancelledError('KAKAO');
    throw e;
  }
}

/* ── 구글 ── */
let googleConfigured = false;
/** GoogleSignin은 configure 전에 다른 함수를 부르면 네이티브에서 앱이 종료될 수 있다 → 항상 먼저 configure */
function ensureGoogleConfigured(G: typeof import('@react-native-google-signin/google-signin')): boolean {
  if (googleConfigured) return true;
  if (!GOOGLE_WEB_CLIENT_ID) return false;
  // webClientId = 웹 애플리케이션 클라이언트 ID → ID 토큰의 aud가 이 값이 된다 (백엔드 허용 Client ID)
  G.GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  googleConfigured = true;
  return true;
}

async function googleIdToken(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const G = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
  if (!ensureGoogleConfigured(G)) throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID 가 없어요 (.env.local 확인)');
  try {
    await G.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const res = await G.GoogleSignin.signIn();
    if (!G.isSuccessResponse(res)) throw new SocialLoginCancelledError('GOOGLE');
    if (!res.data.idToken) throw new Error('구글 ID 토큰을 받지 못했어요 (webClientId 확인)');
    return res.data.idToken;
  } catch (e) {
    if (e instanceof SocialLoginCancelledError) throw e;
    if (G.isErrorWithCode(e) && e.code === G.statusCodes.SIGN_IN_CANCELLED) throw new SocialLoginCancelledError('GOOGLE');
    throw e;
  }
}

export async function getProviderToken(provider: Provider): Promise<string> {
  if (nativeSdkAvailable) return provider === 'KAKAO' ? kakaoAccessToken() : googleIdToken();
  // SDK가 없는 환경(Expo Go·웹): 개발 모드에서만 .env.local 토큰
  const devToken = __DEV__ ? DEV_TOKENS[provider] : undefined;
  if (devToken) return devToken;
  throw new SocialSdkUnavailableError(provider);
}

/**
 * 앱 로그아웃 때 소셜 SDK 세션도 정리 — 다음 로그인에서 계정을 다시 고를 수 있게 (실패해도 무시)
 * ⚠ 로그인한 적 없는 SDK를 건드리면 일부 기기에서 네이티브 오류로 앱이 꺼질 수 있다
 *   → 구글은 configure한 뒤 로그인돼 있을 때만, 카카오는 카카오로 로그인했을 때만 정리한다
 */
export async function socialSignOut(provider?: Provider | null): Promise<void> {
  if (!nativeSdkAvailable) return;
  if (provider !== 'KAKAO') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const G = require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
      if (ensureGoogleConfigured(G) && G.GoogleSignin.hasPreviousSignIn()) await G.GoogleSignin.signOut();
    } catch {
      // 구글로 로그인하지 않았으면 무시
    }
  }
  if (provider === 'KAKAO') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Kakao = require('@react-native-seoul/kakao-login') as typeof import('@react-native-seoul/kakao-login');
      await Kakao.logout();
    } catch {
      // 이미 카카오 세션이 없으면 무시
    }
  }
}
