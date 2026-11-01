import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, ColorToken } from '../theme';

export interface ScreenProps {
  /** 스크롤 영역 위에 고정되는 헤더 (Top Bar, Onboarding bar 등) */
  header?: React.ReactNode;
  /** 화면 하단에 고정되는 버튼 영역 (Figma "Bottom actions") */
  footer?: React.ReactNode;
  children: React.ReactNode;
  bg?: ColorToken;
  /** false면 ScrollView 대신 고정 레이아웃 */
  scroll?: boolean;
  /** TextInput이 있는 화면 */
  keyboard?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** 탭 화면처럼 하단에 떠 있는 탭바가 있을 때 추가 여백 */
  bottomInset?: number;
  footerBg?: ColorToken | 'transparent';
}

/**
 * 공통 화면 골격: SafeArea 상단 여백 + 고정 헤더 + 세로 스크롤 본문 + 고정 하단 버튼.
 * Figma의 "Scroll (세로 스크롤)" 프레임 구조와 1:1 대응.
 */
export function Screen({
  header,
  footer,
  children,
  bg = 'bgApp',
  scroll = true,
  keyboard,
  contentStyle,
  bottomInset = 0,
  footerBg,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const [footerH, setFooterH] = useState(0);
  const bottomPad = (footer ? footerH : insets.bottom) + bottomInset + 24;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, styles.content, { paddingBottom: bottomPad }, contentStyle]}>{children}</View>
  );

  const inner = (
    <View style={[styles.root, { backgroundColor: COLORS[bg], paddingTop: insets.top }]}>
      {header}
      {body}
      {footer ? (
        <View
          onLayout={(e) => setFooterH(e.nativeEvent.layout.height)}
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              backgroundColor: footerBg === 'transparent' ? 'transparent' : COLORS[footerBg ?? bg],
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </View>
  );

  return keyboard ? (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  content: { paddingTop: 8, paddingHorizontal: 24, gap: 14 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
  },
});

/** TextInput이 있는 커스텀 레이아웃(지역 검색·챗봇)용 키보드 회피 래퍼 */
export function KeyboardSafe({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <KeyboardAvoidingView style={style} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {children}
    </KeyboardAvoidingView>
  );
}
