import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS } from '../theme';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Figma Chip (State=Default | Selected) */
export function Chip({ label, selected = false, onPress, style }: ChipProps) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.base, selected ? styles.on : styles.off, style]}
    >
      <AppText variant="callout14Bold" color={selected ? 'textOnDark' : 'textBody'} numberOfLines={1}>
        {label}
      </AppText>
    </Touchable>
  );
}

export interface ChipGroupProps<T extends string> {
  options: readonly T[];
  /** 단일 선택이면 문자열, 복수 선택이면 배열 */
  value: T | T[] | null;
  onChange: (next: T) => void;
  style?: StyleProp<ViewStyle>;
}

/** 칩 여러 개를 줄바꿈 배치 (Figma: H wrap gap8 rgap8) */
export function ChipGroup<T extends string>({ options, value, onChange, style }: ChipGroupProps<T>) {
  const isOn = (o: T) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <View style={[styles.wrap, style]}>
      {options.map((o) => (
        <Chip key={o} label={o} selected={isOn(o)} onPress={() => onChange(o)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    minHeight: 42,
    justifyContent: 'center',
  },
  off: { backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  on: { backgroundColor: COLORS.bgForest, borderWidth: 1, borderColor: COLORS.bgForest },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
