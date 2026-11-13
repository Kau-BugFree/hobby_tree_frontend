import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { COLORS } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

export interface ChoiceProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Figma Choice (선택지 줄, State=Default | Selected) */
export function Choice({ label, selected = false, onPress, disabled, style }: ChoiceProps) {
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={label}
      style={[styles.base, selected ? styles.on : styles.off, disabled && { opacity: 0.45 }, style]}
    >
      <View style={[styles.indicator, selected ? styles.indicatorOn : styles.indicatorOff]}>
        {selected ? <IconSlot name="check" size={14} color="textOnDark" /> : null}
      </View>
      <AppText
        variant={selected ? 'callout14Bold' : 'callout14Regular'}
        color={selected ? 'brandDeep' : 'textBody'}
        style={styles.label}
      >
        {label}
      </AppText>
    </Touchable>
  );
}

export interface ChoiceGroupProps<T extends string> {
  options: readonly T[];
  value: T | T[] | null;
  onChange: (next: T) => void;
  style?: StyleProp<ViewStyle>;
}

export function ChoiceGroup<T extends string>({ options, value, onChange, style }: ChoiceGroupProps<T>) {
  const isOn = (o: T) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <View style={[styles.group, style]}>
      {options.map((o) => (
        <Choice key={o} label={o} selected={isOn(o)} onPress={() => onChange(o)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignSelf: 'stretch',
  },
  off: { backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  on: { backgroundColor: COLORS.bgGreenSoft, borderWidth: 1.5, borderColor: COLORS.brandPrimary },
  indicator: { width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  indicatorOff: { backgroundColor: COLORS.bgSurface, borderWidth: 2, borderColor: COLORS.borderStrong },
  indicatorOn: { backgroundColor: COLORS.bgForest },
  label: { flex: 1 },
  group: { gap: 8, alignSelf: 'stretch' },
});
