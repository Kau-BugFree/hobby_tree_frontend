import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { COLORS, ColorToken } from '../theme';
import { AppText } from './AppText';
import { Touchable } from './Touchable';

/** Figma Button 컴포넌트 Style variant (+ 코드 전용 danger) */
export type ButtonVariant = 'primary' | 'dark' | 'secondary' | 'outline' | 'ghost' | 'water' | 'danger';

export interface ButtonProps {
  label: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** 내용 너비만큼만 차지 (기본은 부모 너비를 채움) */
  hug?: boolean;
}

const VARIANT: Record<ButtonVariant, { bg?: ColorToken; fg: ColorToken; border?: ColorToken }> = {
  primary: { bg: 'brandPrimary', fg: 'textOnDark' },
  dark: { bg: 'bgForest', fg: 'textOnDark' },
  secondary: { bg: 'bgKhaki', fg: 'brandDeep' },
  outline: { bg: 'bgSurface', fg: 'textPrimary', border: 'borderStrong' },
  ghost: { fg: 'textMuted' },
  water: { bg: 'accentWater', fg: 'textOnDark' },
  danger: { bg: 'accentDanger', fg: 'textOnDark' },
};

export function Button({ label, variant = 'primary', onPress, disabled, style, hug }: ButtonProps) {
  const v = VARIANT[variant];
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={[
        styles.base,
        !hug && styles.fill,
        v.bg ? { backgroundColor: COLORS[v.bg] } : null,
        v.border ? { borderWidth: 1, borderColor: COLORS[v.border] } : null,
        disabled && styles.disabled,
        style,
      ]}
    >
      <AppText variant="body16Bold" color={v.fg} align="center" numberOfLines={1}>
        {label}
      </AppText>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: { alignSelf: 'stretch' },
  disabled: { opacity: 0.4 },
});
