import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS, ColorToken } from '../theme';
import { AppText } from './AppText';
import { FigmaSvg, hasFigmaSvg } from './FigmaSvg';
import { IconSlot } from './IconSlot';

export type HobbyKey = '요리' | '커피' | '악기' | '독서' | '러닝';
export type TreeStageNo = 0 | 1 | 2 | 3 | 4 | 5;

export const STAGE_NAME: Record<TreeStageNo, string> = {
  0: '씨앗',
  1: '새싹',
  2: '묘목',
  3: '어린 나무',
  4: '큰 나무',
  5: '세계수',
};

/** Figma Hobby Icon (24×24 원본) */
export function HobbyIcon({ hobby, size = 24, color = 'brandDeep' }: { hobby: HobbyKey; size?: number; color?: ColorToken }) {
  // Figma Hobby Icon 그래픽은 IconSlot이 이름(hobby-*)으로 찾아 그린다
  return <IconSlot name={`hobby-${hobby}`} size={size} color={color} />;
}

/** 아이콘을 둥근 배경 타일 안에 둔 모양 (Figma "Tile") */
export function IconTile({
  children,
  size = 44,
  radius = 14,
  bg = 'bgGreenSoft',
  style,
}: {
  children: React.ReactNode;
  size?: number;
  radius?: number;
  bg?: ColorToken;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.tile, { width: size, height: size, borderRadius: radius, backgroundColor: COLORS[bg] }, style]}>
      {children}
    </View>
  );
}

/**
 * Figma Tree Stage 일러스트 (원본 300×240, 단계 0~5).
 * 벡터 일러스트는 에셋으로 교체한다.
 */
export function TreeStage({ stage, scale = 1, style }: { stage: TreeStageNo; scale?: number; style?: StyleProp<ViewStyle> }) {
  const w = Math.round(300 * scale);
  const h = Math.round(240 * scale);
  const label = `나무 ${stage}단계 ${STAGE_NAME[stage]}`;
  // Figma Tree Stage 일러스트 (tree-0 ~ tree-5)
  if (hasFigmaSvg(`tree-${stage}`)) {
    return (
      <View accessibilityLabel={label} style={[{ width: w, height: h }, style]}>
        <FigmaSvg name={`tree-${stage}`} width={w} height={h} />
      </View>
    );
  }
  return (
    <View
      accessibilityLabel={label}
      style={[styles.tree, { width: w, height: h, borderRadius: Math.max(8, 16 * scale) }, style]}
    >
      {scale >= 0.3 ? (
        <AppText variant="micro11Bold" color="textMuted">
          {`${stage}단계 · ${STAGE_NAME[stage]}`}
        </AppText>
      ) : null}
    </View>
  );
}

/** 이미지·일러스트 자리 (Figma "illustration" 프레임) */
export function IllustrationSlot({ name, width, height, style }: { name: string; width: number | `${number}%`; height: number; style?: StyleProp<ViewStyle> }) {
  // Figma 일러스트 (class-<클래스 id> 등). 없는 이름은 점선 자리 표시를 그린다
  if (hasFigmaSvg(name)) {
    return (
      <View accessibilityLabel={name} style={[{ width, height }, style]}>
        <FigmaSvg name={name} width={typeof width === 'number' ? width : '100%'} height={height} />
      </View>
    );
  }
  return <View accessibilityLabel={name} style={[styles.illu, { width, height }, style]} />;
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center' },
  tree: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.borderStrong,
  },
  illu: { borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.borderStrong },
});
