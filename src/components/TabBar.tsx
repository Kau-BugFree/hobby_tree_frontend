import type { BottomTabBarProps } from 'expo-router/js-tabs';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../theme';
import { AppText } from './AppText';
import { IconSlot } from './IconSlot';
import { Touchable } from './Touchable';

/** 라우트 이름 → 탭 라벨 (Figma Tab Bar: 홈 · 체험 · 함께 · 마이) */
export const TAB_LABEL: Record<string, string> = {
  home: '홈',
  experience: '체험',
  together: '함께',
  my: '마이',
};

/** 라우트 이름 → 아이콘 (선 아이콘, 선택 시 brand/primary) */
const TAB_ICON: Record<string, string> = {
  home: 'sprout',
  experience: 'search',
  together: 'users',
  my: 'person',
};

/** 탭바 높이 (화면 하단 여백 계산용, 홈 인디케이터 제외) */
export const TAB_BAR_HEIGHT = 60;

/** Figma "Tab Bar" — 화면 아래 붙은 흰 바 + 위 테두리 · 아이콘 22 + 라벨 11 */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = TAB_LABEL[route.name] ?? route.name;
        const color = focused ? 'brandPrimary' : 'textMuted';
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
            style={styles.tab}
          >
            <IconSlot name={TAB_ICON[route.name] ?? 'sprout'} size={22} color={color} />
            <AppText variant="micro11Bold" color={color}>
              {label}
            </AppText>
          </Touchable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingTop: 8,
    backgroundColor: COLORS.bgSurface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderDefault,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 4 },
});
