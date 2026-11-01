import { Platform, TextStyle } from 'react-native';

/**
 * Figma 텍스트 스타일 → RN TextStyle.
 * - lineHeight(%)와 letterSpacing(%)은 fontSize 기준 px로 환산했다.
 * - Android는 커스텀 폰트에서 fontWeight를 함께 주면 합성 볼드가 생기므로
 *   굵기별 fontFamily만 지정하고, iOS에만 fontWeight 문자열을 함께 준다.
 */
export const FONT = {
  regular: 'NotoSansKR_400Regular',
  medium: 'NotoSansKR_500Medium',
  bold: 'NotoSansKR_700Bold',
  black: 'NotoSansKR_900Black',
} as const;

type Weight = keyof typeof FONT;
const WEIGHT: Record<Weight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  bold: '700',
  black: '900',
};

const make = (weight: Weight, size: number, lineHeightPct: number, letterSpacingPct: number): TextStyle => ({
  fontFamily: FONT[weight],
  fontSize: size,
  lineHeight: Math.round((size * lineHeightPct) / 100),
  letterSpacing: +((size * letterSpacingPct) / 100).toFixed(2),
  ...Platform.select<TextStyle>({ ios: { fontWeight: WEIGHT[weight] }, default: {} }),
});

export const TYPO = {
  display34Black: make('black', 34, 122, -3),
  title26Black: make('black', 26, 130, -2.5),
  title22Bold: make('bold', 22, 135, -2),
  headline18Bold: make('bold', 18, 140, -1.5),
  body16Bold: make('bold', 16, 145, -1.5),
  body16Regular: make('regular', 16, 150, -1),
  callout14Regular: make('regular', 14, 150, -1),
  callout14Bold: make('bold', 14, 145, -1),
  caption12Medium: make('medium', 12, 140, -0.5),
  caption12Bold: make('bold', 12, 140, -0.5),
  micro11Bold: make('bold', 11, 130, 0),
} as const;

export type TypoToken = keyof typeof TYPO;
