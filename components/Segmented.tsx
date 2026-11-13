import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS, TypoToken } from '../theme';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

export interface SegmentedProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  variant?: TypoToken;
  accessibilityLabel?: string;
}

/** 같은 너비로 나뉜 단일 선택 (Figma H-04 "오늘 해 봤나요?" 등) */
export function Segmented<T extends string>({ options, value, onChange, variant = 'callout14Bold', accessibilityLabel }: SegmentedProps<T>) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Touchable
            key={o}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o}
            onPress={() => onChange(o)}
            style={[styles.seg, on ? styles.on : styles.off]}
          >
            <AppText variant={variant} color={on ? 'textOnDark' : 'textPrimary'} align="center">
              {o}
            </AppText>
          </Touchable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  seg: { flex: 1, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  on: { backgroundColor: COLORS.bgForest },
  off: { backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
});
