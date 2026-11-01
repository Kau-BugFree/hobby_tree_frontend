import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS, ColorToken } from '../theme';
import { AppText } from './AppText';

/** Figma Tag Tone variant */
export type TagTone = 'green' | 'solid' | 'khaki' | 'ad' | 'gray' | 'onDark' | 'water';

const TONE: Record<TagTone, { bg: ColorToken; fg: ColorToken }> = {
  green: { bg: 'bgGreenSoft', fg: 'brandDeep' },
  solid: { bg: 'brandPrimary', fg: 'textOnDark' },
  khaki: { bg: 'bgKhaki', fg: 'textBody' },
  ad: { bg: 'accentAdBg', fg: 'accentAd' },
  gray: { bg: 'bgSunken', fg: 'textMuted' },
  onDark: { bg: 'bgForest2', fg: 'textOnDark' },
  water: { bg: 'accentWaterBg', fg: 'accentWater' },
};

export interface TagProps {
  label: string;
  tone?: TagTone;
  style?: StyleProp<ViewStyle>;
}

export function Tag({ label, tone = 'green', style }: TagProps) {
  const t = TONE[tone];
  return (
    <View style={[styles.base, { backgroundColor: COLORS[t.bg] }, style]}>
      <AppText variant="micro11Bold" color={t.fg} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export function TagRow({ tags, style }: { tags: { label: string; tone?: TagTone }[]; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      {tags.map((t) => (
        <Tag key={t.label} label={t.label} tone={t.tone} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 999, alignSelf: 'flex-start' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
