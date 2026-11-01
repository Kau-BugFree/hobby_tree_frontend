export { COLORS } from './colors';
export type { ColorToken } from './colors';
export { TYPO, FONT } from './typography';
export type { TypoToken } from './typography';
export { SHADOWS, shadow } from './shadow';

/** 화면 공통 수치 (Figma 기준 좌우 여백 24, 최소 터치 영역 44) */
export const LAYOUT = {
  gutter: 24,
  minTouch: 44,
  radiusPill: 999,
} as const;
