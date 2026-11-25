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
      bg="bgApp"
      footer={
        <>
          <Button label="4단계 활동 보기" onPress={() => reset('/experience')} />
          <Touchable small onPress={() => reset('/home')} style={styles.link}>
            <AppText variant="callout14Bold" color="textMuted">
              홈으로
            </AppText>
          </Touchable>
        </>
      }
      contentStyle={styles.content}
    >
      <LinearGradient colors={[COLORS.bgGreenSoft, COLORS.bgApp]} style={styles.glow}>
        <TreeStage stage={4} scale={1.1} />
      </LinearGradient>
      <View style={styles.tags}>
        <Tag label="3단계 어린 나무" tone="green" />
        <IconSlot name="arrow-right" size={18} color="brandPrimary" />
        <Tag label="4단계 큰 나무" tone="solid" />
      </View>
      <AppText variant="title26Black" color="brandDeep" align="center">
        {'독서 나무가\n큰 나무로 자랐어요!'}
      </AppText>
      <AppText variant="callout14Regular" color="textMuted" align="center">
        3단계 활동 3개를 마쳤어요. 4단계 ‘비교하며 깊게 읽기’ 활동을 시작할 수 있어요.
      </AppText>
      <Touchable accessibilityLabel="다음 단계 안내" onPress={() => go('/home/world-tree')} style={styles.next}>
        <IconSlot name="flag" size={18} color="brandDeep" />
        <AppText variant="caption12Bold" color="brandDeep" style={styles.flex}>
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
    backgroundColor: COLORS.bgGreenSoft,
  },
  link: { paddingVertical: 8 },
});
