/** H-05 성장 · 큰 나무가 됐어요 */
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, Screen, Tag, Touchable, TreeStage } from '../../components';
import { go, reset } from '../../lib/nav';
import { COLORS } from '../../theme';

export default function GrowthScreen() {
  return (
    <Screen
      bg="bgForest"
      footer={
        <>
          <Button variant="secondary" label="4단계 활동 보기" onPress={() => reset('/experience')} />
          <Touchable small onPress={() => reset('/home')} style={styles.link}>
            <AppText variant="callout14Bold" color="textOnDarkMuted">
              홈으로
            </AppText>
          </Touchable>
        </>
      }
      contentStyle={styles.content}
    >
      <LinearGradient colors={[COLORS.brandMid, COLORS.bgForest]} style={styles.glow}>
        <TreeStage stage={4} scale={1.1} />
      </LinearGradient>
      <View style={styles.tags}>
        <Tag label="3단계 어린 나무" tone="onDark" />
        <IconSlot name="arrow-right" size={18} color="paletteKhaki" />
        <Tag label="4단계 큰 나무" tone="solid" />
      </View>
      <AppText variant="title26Black" color="textOnDark" align="center">
        {'독서 나무가\n큰 나무로 자랐어요!'}
      </AppText>
      <AppText variant="callout14Regular" color="textOnDarkMuted" align="center">
        3단계 활동 3개를 마쳤어요. 4단계 ‘비교하며 깊게 읽기’ 활동을 시작할 수 있어요.
      </AppText>
      <Touchable accessibilityLabel="다음 단계 안내" onPress={() => go('/home/world-tree')} style={styles.next}>
        <IconSlot name="flag" size={18} color="textOnDark" />
        <AppText variant="caption12Bold" color="textOnDark" style={styles.flex}>
          다음: 4단계 활동 3개를 마치면 세계수
        </AppText>
      </Touchable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { alignItems: 'center', gap: 12, paddingTop: 20 },
  glow: { alignSelf: 'stretch', height: 300, borderRadius: 150, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  next: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: COLORS.bgForest2,
  },
  link: { paddingVertical: 8 },
});
