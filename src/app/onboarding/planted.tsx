/**
 * O-07 나무 심기 완료
 * - "Seeds" 행은 Figma에서 gap -18(겹침) → 음수 gap 대신 자식 marginLeft로 처리
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, Screen, Tag, TreeStage, TreeStageNo, STAGE_NAME } from '../../components';
import { useAppState } from '../../lib/appState';
import { reset } from '../../lib/nav';
import { COLORS } from '../../theme';

const STAGES: TreeStageNo[] = [0, 1, 2, 3, 4, 5];

export default function OnboardingPlanted() {
  const { state } = useAppState();
  const n = state.picked.length;
  return (
    <Screen
      bg="bgForest"
      scroll
      footer={<Button variant="secondary" label="내 나무 보러 가기" onPress={() => reset('/home')} />}
      contentStyle={styles.content}
    >
      <View style={styles.seeds}>
        {state.picked.map((h, i) => (
          <TreeStage key={h} stage={0} scale={110 / 300} style={i > 0 ? styles.overlap : undefined} />
        ))}
      </View>
      <View style={styles.tags}>
        {state.picked.map((h) => (
          <Tag key={h} label={`${h} 씨앗`} tone="onDark" />
        ))}
      </View>
      <AppText variant="title26Black" color="textOnDark" align="center">
        {`씨앗 ${n}개를 심었어요`}
      </AppText>
      <AppText variant="callout14Regular" color="textOnDarkMuted" align="center">
        {'같은 단계 활동을 3개 마치면\n나무가 한 단계씩 자라요.'}
      </AppText>
      <View style={styles.guide}>
        <AppText variant="caption12Bold" color="paletteKhaki">
          나무가 자라는 6단계
        </AppText>
        <View style={styles.stageRow}>
          {STAGES.map((s) => (
            <View key={s} style={styles.stageCol}>
              <TreeStage stage={s} scale={54 / 300} />
              <AppText variant="micro11Bold" color="textOnDark" align="center">
                {`${s} ${STAGE_NAME[s]}`}
              </AppText>
            </View>
          ))}
        </View>
        <View style={styles.water}>
          <IconSlot name="leaf" size={16} color="accentWater" />
          <AppText variant="caption12Bold" color="accentWater" style={styles.flex}>
            단계마다 활동 3개 · 원하는 것만 골라서 해요
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { alignItems: 'center', gap: 16, paddingTop: 30 },
  seeds: { flexDirection: 'row', justifyContent: 'center' },
  overlap: { marginLeft: -18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  guide: { alignSelf: 'stretch', gap: 10, padding: 16, borderRadius: 24, backgroundColor: COLORS.bgForest2 },
  stageRow: { flexDirection: 'row', gap: 2 },
  stageCol: { flex: 1, alignItems: 'center', gap: 2 },
  water: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.accentWaterBg,
  },
});
