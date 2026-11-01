/** H-06 최고 단계 · 세계수 완성 (5단계 도달 시) */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen, Tag, Touchable, TreeStage } from '../../components';
import { go, reset } from '../../lib/nav';
import { COLORS } from '../../theme';

interface Stat {
  value: string;
  label: string;
}

/** MOCK_DATA — TODO(API): GET /me/trees/:id/summary */
const STATS: Stat[] = [
  { value: '6단계', label: '지나온 단계' },
  { value: '18개', label: '해 본 활동' },
  { value: '2번', label: '함께한 활동' },
];

function StatBox({ stat }: { stat: Stat }) {
  return (
    <View style={styles.stat}>
      <AppText variant="headline18Bold" color="paletteKhaki">
        {stat.value}
      </AppText>
      <AppText variant="micro11Bold" color="textOnDarkMuted">
        {stat.label}
      </AppText>
    </View>
  );
}

export default function WorldTreeScreen() {
  return (
    <Screen
      bg="bgForest"
      footer={
        <>
          <Button variant="secondary" label="새 취미 나무 심기" onPress={() => go('/home/plant')} />
          <Touchable small onPress={() => reset('/home')} style={styles.link}>
            <AppText variant="callout14Bold" color="textOnDarkMuted">
              완성한 나무 계속 가꾸기
            </AppText>
          </Touchable>
        </>
      }
      contentStyle={styles.content}
    >
      <Tag label="5단계 · 최고 단계 달성" tone="solid" style={styles.center} />
      <TreeStage stage={5} scale={1.2} />
      <AppText variant="title26Black" color="textOnDark" align="center">
        독서 세계수가 완성됐어요
      </AppText>
      <AppText variant="callout14Regular" color="textOnDarkMuted" align="center">
        씨앗을 심은 지 11주 만이에요. 완성된 나무는 MY의 숲에 계속 남아요.
      </AppText>
      <View style={styles.stats}>
        {STATS.map((s) => (
          <StatBox key={s.label} stat={s} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center', gap: 12, paddingHorizontal: 20 },
  center: { alignSelf: 'center' },
  stats: { alignSelf: 'stretch', flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 11, paddingHorizontal: 10, borderRadius: 20, backgroundColor: COLORS.bgForest2 },
  link: { paddingVertical: 8 },
});
