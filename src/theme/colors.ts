/**
 * Figma 변수 컬렉션 "HobbyTree v5" (Light 모드)에서 추출한 색상 토큰.
 * 키 이름은 Figma 변수 경로(`bg/app` → `bgApp`)를 그대로 따른다.
 */
export const COLORS = {
  paletteCream: '#FBF5DD',
  paletteKhaki: '#E7E1B1',
  paletteGreen: '#306D29',
  paletteForest: '#0D530E',

  bgApp: '#FBF5DD',
  bgSurface: '#FFFDF4',
  bgSunken: '#F3ECCC',
  bgKhaki: '#E7E1B1',
  bgGreenSoft: '#E3EBC8',
  bgForest: '#0D530E',
  bgForest2: '#1D6421',

  brandPrimary: '#306D29',
  brandDeep: '#0D530E',
  brandMid: '#8DAE78',

  textPrimary: '#16210F',
  textBody: '#3B4533',
  textMuted: '#77745D',
  textOnDark: '#FBF5DD',
  textOnDarkMuted: '#C7D2AC',

  borderDefault: '#E4DCB8',
  borderStrong: '#CCC392',

  accentWater: '#3E8FCF',
  accentWaterBg: '#DDEBF5',
  accentFruit: '#D08A2E',
  accentAd: '#8A5E0F',
  accentAdBg: '#F4E4B5',
  accentDanger: '#A83B28',

  /** 오버레이 딤 (Figma: #0D1F0A @ 45%) */
  dim: 'rgba(13, 31, 10, 0.45)',
  dimLight: 'rgba(13, 31, 10, 0.35)',
  white: '#FFFFFF',
  black: '#000000',
  /** 탭바 글래스 캡슐 (Figma: #FFFCF2 @ 55%, 테두리 #FFFFFF @ 70%) */
  glass: 'rgba(255, 252, 242, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.7)',
  onDarkGlass: 'rgba(255, 255, 255, 0.14)',
  onDarkGlassSoft: 'rgba(255, 255, 255, 0.06)',
  onDarkChip: 'rgba(255, 255, 255, 0.1)',
  onDarkTile: 'rgba(255, 255, 255, 0.12)',
  onDarkTrack: 'rgba(255, 255, 255, 0.16)',
  /** iOS 시스템 알림 색 (권한 요청 안내용) */
  iosBlue: '#007AFF',
  /** Android 탭바 (블러 대신 거의 불투명한 유리색) */
  androidGlass: 'rgba(255, 252, 242, 0.94)',
  /** 그림자 색 (Figma effect color) */
  shadowForest: '#0D330D',
  shadowDeep: '#0D260D',
  shadowWater: '#3D8FCF',
  /** 소셜 로그인 버튼 — 각 사 브랜드 가이드 색 */
  kakaoBg: '#FEE500',
  kakaoFg: '#1A1A1A',
  appleBg: '#FFFFFF',
  appleFg: '#0D0D0D',
} as const;

export type ColorToken = keyof typeof COLORS;
