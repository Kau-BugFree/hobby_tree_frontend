import { Href, router } from 'expo-router';

/**
 * Figma 프로토타입 동작 → 라우터 호출
 * - NAVIGATE  → go / reset
 * - OVERLAY   → go (transparentModal 라우트)
 * - SWAP      → swap (지금 열린 오버레이를 다른 오버레이로 교체)
 * - BACK/CLOSE→ back
 */
export const go = (href: string) => router.push(href as Href);
export const swap = (href: string) => router.replace(href as Href);
export const back = () => (router.canGoBack() ? router.back() : router.replace('/home' as Href));
/** 스택을 비우고 이동 (예: 온보딩 완료 → 홈 탭) */
export const reset = (href: string) => {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href as Href);
};

/** 메인 탭 경로 */
export const TABS = {
  home: '/home',
  experience: '/experience',
  together: '/together',
  my: '/my',
} as const;
