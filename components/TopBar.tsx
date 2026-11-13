import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

export interface TopBarProps {
  title: string;
  tone?: 'light' | 'dark';
  onBack?: () => void;
  /** 오른쪽 ‘…’ 버튼 (Show action) */
  onAction?: () => void;
  hideBack?: boolean;
}

/** Figma Top Bar (Tone=Light | Dark). 뒤로가기 기본 동작은 router.back(). */
export function TopBar({ title, tone = 'light', onBack, onAction, hideBack }: TopBarProps) {
  const dark = tone === 'dark';
  const circle = [styles.circle, { backgroundColor: dark ? COLORS.onDarkGlass : COLORS.bgSurface }];
  return (
    <View style={styles.bar}>
      {hideBack ? (
        <View style={styles.spacer} />
      ) : (
        <Touchable
          accessibilityLabel="뒤로"
          onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')))}
          style={circle}
        >
          <IconSlot name="back" size={22} color={dark ? 'textOnDark' : 'textPrimary'} />
        </Touchable>
      )}
      <AppText variant="headline18Bold" color={dark ? 'textOnDark' : 'textPrimary'} align="center" style={styles.title} numberOfLines={1}>
        {title}
      </AppText>
      {onAction ? (
        <Touchable accessibilityLabel="더보기" onPress={onAction} style={circle}>
          <IconSlot name="more" size={22} color={dark ? 'textOnDark' : 'textPrimary'} />
        </Touchable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  circle: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  spacer: { width: 44, height: 44 },
  title: { flex: 1 },
});
