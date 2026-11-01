import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOWS } from '../theme';

const close = () => (router.canGoBack() ? router.back() : router.replace('/home'));

/** Figma "Dim" 레이어: 누르면 오버레이 닫기(CLOSE) */
function Dim({ onPress, light }: { onPress?: () => void; light?: boolean }) {
  return (
    <Pressable
      accessibilityLabel="닫기"
      accessibilityRole="button"
      onPress={onPress}
      style={[StyleSheet.absoluteFill, { backgroundColor: light ? COLORS.dimLight : COLORS.dim }]}
    />
  );
}

export interface OverlaySheetProps {
  children: React.ReactNode;
  /** 딤을 눌렀을 때 동작 (기본: 닫기). null이면 닫히지 않음 */
  onDismiss?: (() => void) | null;
  style?: StyleProp<ViewStyle>;
  gap?: number;
  /** 시트 배경 아래 화면을 같이 그릴 때 (예: T-03처럼 화면 위에 시트가 덮인 프레임) */
  backdrop?: React.ReactNode;
}

/** 아래에서 올라오는 바텀 시트 (grabber + 위쪽 radius 32) */
export function OverlaySheet({ children, onDismiss, style, gap = 12, backdrop }: OverlaySheetProps) {
  const insets = useSafeAreaInsets();
  const [y] = useState(() => new Animated.Value(40));
  useEffect(() => {
    Animated.spring(y, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 18 }).start();
  }, [y]);
  return (
    <View style={styles.full}>
      {backdrop}
      <Dim onPress={onDismiss === null ? undefined : onDismiss ?? close} />
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 16) + 18, gap, transform: [{ translateY: y }] },
          style,
        ]}
      >
        <View style={styles.grabberRow}>
          <View style={styles.grabber} />
        </View>
        {children}
      </Animated.View>
    </View>
  );
}

export interface OverlayDialogProps {
  children: React.ReactNode;
  onDismiss?: (() => void) | null;
  style?: StyleProp<ViewStyle>;
  dimLight?: boolean;
}

/** 화면 가운데 확인창 (Figma "Dialog", 너비 330) */
export function OverlayDialog({ children, onDismiss, style, dimLight }: OverlayDialogProps) {
  return (
    <View style={[styles.full, styles.center]}>
      <Dim light={dimLight} onPress={onDismiss === null ? undefined : onDismiss ?? close} />
      <View style={[styles.dialog, style]}>{children}</View>
    </View>
  );
}

export const closeOverlay = close;

const styles = StyleSheet.create({
  full: { flex: 1, justifyContent: 'flex-end' },
  center: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 },
  sheet: {
    backgroundColor: COLORS.bgSurface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 10,
    paddingHorizontal: 24,
  },
  grabberRow: { alignItems: 'center', paddingBottom: 6 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: COLORS.borderStrong },
  dialog: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 10,
    alignItems: 'center',
    ...SHADOWS.dialog,
  },
});
