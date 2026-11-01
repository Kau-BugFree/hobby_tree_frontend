import { Platform, ViewStyle } from 'react-native';
import { COLORS } from './colors';

/** Figma DROP_SHADOW → iOS shadow* / Android elevation 분기 */
export const shadow = (
  color: string,
  offsetY: number,
  radius: number,
  opacity: number,
  elevation: number,
): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius / 2,
    },
    android: { elevation, shadowColor: color },
    default: {},
  }) as ViewStyle;

export const SHADOWS = {
  /** 탭바 캡슐: shadow(0,10,28,#0D330D@0.18) */
  tabBar: shadow(COLORS.shadowForest, 10, 28, 0.18, 8),
  /** 챗봇 FAB: shadow(0,10,24,#0D400D@0.35) */
  fab: shadow('#0D400D', 10, 24, 0.35, 10),
  /** 다이얼로그: shadow(0,16,40,#0D260D@0.25) */
  dialog: shadow(COLORS.shadowDeep, 16, 40, 0.25, 16),
  /** 토스트: shadow(0,8,24,#000@0.2) */
  toast: shadow('#000000', 8, 24, 0.2, 10),
  /** 카드(얕은) */
  card: shadow(COLORS.shadowForest, 6, 18, 0.12, 4),
} as const;
