/**
 * Figma "HobbyTree 하비트리 · 모바일 앱 디자인" 변수(text/primary · brand/primary · bg/app · bg/tint …)로 맞춘 색상 토큰.
 * 예전 v5 카키 토큰 이름(bgKhaki 등)은 그대로 두고 값만 새 팔레트(bg/tint-soft 등)로 바꿨다.
 * 키 이름은 Figma 변수 경로(`bg/app` → `bgApp`)를 그대로 따른다.
 */
export const COLORS = {
  paletteCream: '#F6F9F7',
  paletteKhaki: '#E6F5EC',
  paletteGreen: '#17AD53',
  paletteForest: '#0E6B39',

  bgApp: '#F6F9F7',
  bgSurface: '#FFFFFF',
  bgSunken: '#EEF2EF',
  bgKhaki: '#F3FAF6',
  bgGreenSoft: '#E6F5EC',
  bgForest: '#0E6B39',
  bgForest2: '#17AD53',

  brandPrimary: '#17AD53',
  brandDeep: '#0E6B39',
  brandMid: '#8ED3A9',

  textPrimary: '#15201A',
  textBody: '#39463F',
  textMuted: '#6B786F',
  textOnDark: '#FFFFFF',
  textOnDarkMuted: '#D4EEDD',

  borderDefault: '#DCE5DF',
  borderStrong: '#C3D1C8',

  accentWater: '#3E8FCF',
  accentWaterBg: '#DDEBF5',
  accentFruit: '#D08A2E',
  accentAd: '#8A5E0F',
  accentAdBg: '#F4E4B5',
  accentDanger: '#A83B28',

  /** 오버레이 딤 (Figma: #0D1F0A @ 45%) */
  dim: 'rgba(21, 32, 26, 0.45)',
  dimLight: 'rgba(13, 31, 10, 0.35)',
  white: '#FFFFFF',
  black: '#000000',
  /** 탭바 글래스 캡슐 (Figma: #FFFCF2 @ 55%, 테두리 #FFFFFF @ 70%) */
  glass: 'rgba(255, 255, 255, 0.96)',
  glassBorder: 'rgba(255, 255, 255, 0.7)',
  onDarkGlass: 'rgba(255, 255, 255, 0.14)',
  onDarkGlassSoft: 'rgba(255, 255, 255, 0.06)',
  onDarkChip: 'rgba(255, 255, 255, 0.1)',
  onDarkTile: 'rgba(255, 255, 255, 0.12)',
  onDarkTrack: 'rgba(255, 255, 255, 0.16)',
  /** iOS 시스템 알림 색 (권한 요청 안내용) */
  iosBlue: '#007AFF',
  /** Android 탭바 (블러 대신 거의 불투명한 유리색) */
  androidGlass: '#FFFFFF',
  /** 그림자 색 (Figma effect color) */
  shadowForest: '#0D330D',
  shadowDeep: '#0D260D',
  shadowWater: '#3D8FCF',
  /** 소셜 로그인 버튼 — 각 사 브랜드 가이드 색 */
  kakaoBg: '#FEE500',
  kakaoFg: '#1A1A1A',
  appleBg: '#FFFFFF',
  appleFg: '#0D0D0D',
  /** 결제 수단 배지 — 네이버페이 대표색 */
  naverBg: '#03C75A',
  naverFg: '#FFFFFF',
  /** 구글 로그인 버튼 (Google 브랜드 가이드 — 흰 배경 + 회색 테두리) */
  googleBg: '#FFFFFF',
  googleFg: '#1F1F1F',
  googleBorder: '#747775',
} as const;

export type ColorToken = keyof typeof COLORS;
