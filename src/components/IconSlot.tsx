import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { ICON_SVG } from '../assets/iconSvg';
import { COLORS, ColorToken } from '../theme';
import { FigmaSvg, hasFigmaSvg } from './FigmaSvg';

export interface IconSlotProps {
  /** Figma 아이콘 노드 이름 (예: chev, bell, search) */
  name: string;
  size?: number;
  width?: number;
  height?: number;
  color?: ColorToken;
  style?: StyleProp<ViewStyle>;
}

/**
 * 아이콘·벡터 그래픽 자리 표시자.
 * Figma 원본 크기만 확보하고, 실제 그래픽은 SVG 컴포넌트로 교체한다.
 */
export function IconSlot({ name, size = 24, width, height, color = 'textMuted', style }: IconSlotProps) {
  const w = width ?? size;
  const h = height ?? size;
  // Figma 컴포넌트 그래픽이 있으면 그걸 그린다 (hobby-*, tab-*, chat-spark …)
  if (hasFigmaSvg(name)) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={`icon-${name}`}
        style={[{ width: w, height: h }, style]}
      >
        <FigmaSvg name={name} width={w} height={h} />
      </View>
    );
  }
  // 공통 선 아이콘 (check, chev, bell …) — color 토큰으로 색을 입힌다
  const icon = ICON_SVG[name];
  if (icon) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={`icon-${name}`}
        style={[{ width: w, height: h }, style]}
      >
        <SvgXml xml={icon} width={w} height={h} color={COLORS[color]} />
      </View>
    );
  }
  // 그래픽이 없는 이름은 자리 표시
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={`icon-${name}`}
      style={[
        {
          width: w,
          height: h,
          borderRadius: Math.min(w, h) / 4,
          borderWidth: 1.5,
          borderColor: COLORS[color],
          opacity: 0.35,
        },
        style,
      ]}
    />
  );
}
