import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';

import { COLORS, ColorToken, TYPO, TypoToken } from '../theme';

export interface AppTextProps extends TextProps {
  variant?: TypoToken;
  color?: ColorToken;
  align?: TextStyle['textAlign'];
}

/** 모든 Figma TEXT 노드는 이 컴포넌트로 렌더링한다 (Android 폰트 패딩 보정 포함). */
export function AppText({ variant = 'body16Regular', color = 'textPrimary', align, style, ...rest }: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[styles.base, TYPO[variant], { color: COLORS[color] }, align ? { textAlign: align } : null, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
