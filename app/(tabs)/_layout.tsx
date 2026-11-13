import { Tabs } from 'expo-router/js-tabs';
import React from 'react';

import { TabBar } from '../../components';
import { COLORS } from '../../theme';

/** 메인 탭 4개 (Figma Tab Bar: 홈 · 체험 · 함께 · MY) — 떠 있는 글래스 탭바 */
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: COLORS.bgApp } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="experience" />
      <Tabs.Screen name="together" />
      <Tabs.Screen name="my" />
    </Tabs>
  );
}
