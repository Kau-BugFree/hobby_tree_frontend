import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { ICON_SVG } from '../assets/iconSvg';
import { COLORS, ColorToken } from '../theme';
import { FIGMA_SVG } from '../assets/figmaSvg';
import { FigmaSvg, hasFigmaSvg } from './FigmaSvg';

/**
 * 한 가지 색으로만 그려진 Figma 아이콘. 원본 색을 currentColor로 바꿔 color 토큰을 따르게 한다.
 * (예: 체험 탭에서 선택된 취미 칸은 배경이 진한 초록이라, 원본 초록 아이콘이 배경에 묻혀 사라졌다)
 * 탭바 아이콘(tab-*)과 나무 그림(tree-*)은 원본 색을 그대로 쓴다.
 */
const isTintable = (name: string) => name.startsWith('hobby-') || name === 'chat-spark';
const tintCache: Record<string, string> = {};
function tinted(name: string) {
  if (!tintCache[name]) tintCache[name] = FIGMA_SVG[name].replace(/#[0-9A-Fa-f]{6}\b/g, 'currentColor');
  return tintCache[name];
}

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
  if (hasFigmaSvg(name) && isTintable(name)) {
    return (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={`icon-${name}`}
        style={[{ width: w, height: h }, style]}
      >
        <SvgXml xml={tinted(name)} width={w} height={h} color={COLORS[color]} />
      </View>
    );
  }
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
