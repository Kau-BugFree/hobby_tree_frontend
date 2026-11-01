import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, SHADOWS } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

/** 라우트 이름 → 탭 라벨 (Figma Tab/홈 · 체험 · 함께 · MY) */
export const TAB_LABEL: Record<string, string> = {
  home: '홈',
  experience: '체험',
  together: '함께',
  my: 'MY',
};

/** 탭바 높이 (화면 하단 여백 계산용, 홈 인디케이터 제외) */
export const TAB_BAR_HEIGHT = 74;

/**
 * Figma "Tab Bar (liquid glass)" — 떠 있는 글래스 캡슐.
 * iOS는 BlurView, Android는 블러 성능 이슈로 반투명 단색으로 대체한다.
 */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const capsule = (
    <View style={styles.row}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = TAB_LABEL[route.name] ?? route.name;
        return (
          <Touchable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            onPress={() => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            }}
            style={[styles.tab, focused && styles.tabOn]}
          >
            <IconSlot name={`tab-${label}-${focused ? 'on' : 'off'}`} size={22} color={focused ? 'brandDeep' : 'textBody'} />
            <AppText variant="micro11Bold" color={focused ? 'brandDeep' : 'textBody'}>
              {label}
            </AppText>
          </Touchable>
        );
      })}
    </View>
  );
  return (
    <View pointerEvents="box-none" style={[styles.host, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={[styles.capsule, SHADOWS.tabBar]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} tint="light" style={styles.blur}>
            {capsule}
          </BlurView>
        ) : (
          <View style={[styles.blur, styles.androidGlass]}>{capsule}</View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: 6 },
  capsule: { width: 300, maxWidth: '86%', borderRadius: 999 },
  blur: {
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 5,
  },
  androidGlass: { backgroundColor: COLORS.androidGlass },
  row: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 7, borderRadius: 999 },
  tabOn: { backgroundColor: COLORS.paletteKhaki },
});
