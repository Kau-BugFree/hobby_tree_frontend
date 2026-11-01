/**
 * O-05-2 정보 종합 · 추천 준비
 * - Figma: AFTER_TIMEOUT 1.6s → O-06. 실제 앱에서는 추천 API 응답이 오면 이동한다.
 */
import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconSlot, TreeStage } from '../../components';
import { useAppState } from '../../lib/appState';
import { summarize } from '../../lib/summary';
import { COLORS } from '../../theme';

const MIN_WAIT_MS = 1600;

function CheckLine({ text, done }: { text: string; done: boolean }) {
  return (
    <View style={styles.line}>
      <View style={[styles.dot, done ? styles.dotDone : styles.dotPending]}>
        {done ? <IconSlot name="check" size={13} color="brandDeep" /> : null}
      </View>
      <AppText variant="callout14Bold" color={done ? 'textOnDark' : 'textOnDarkMuted'} style={styles.flex}>
        {text}
      </AppText>
    </View>
  );
}

export default function OnboardingSummary() {
  const insets = useSafeAreaInsets();
  const { state } = useAppState();
  const s = summarize(state);

  useEffect(() => {
    // TODO(API/AI): POST /recommendations 로 온보딩 답변 전송 → 응답 수신 후 이동 (최소 노출 시간 유지)
    const t = setTimeout(() => router.replace('/onboarding/recommend'), MIN_WAIT_MS);
    return () => clearTimeout(t);
  }, []);

  const lines = [
    `상태·관심 · 시작 전 · ${s.interests}`,
    `예산 · 첫 활동 ${s.firstSpendShort} · 이번 달 ${s.monthly}`,
    `시간 · 한 번에 ${s.sessionShort} · ${s.weeklyShort}`,
    `물건·환경 · ${s.place} · ${s.exclude} 제외 · ${s.company}`,
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.ring}>
        <ActivityIndicator size="large" color={COLORS.paletteKhaki} style={StyleSheet.absoluteFill} />
        <TreeStage stage={1} scale={0.62} />
      </View>
      <AppText variant="title22Bold" color="textOnDark" align="center">
        {`${state.userName} 님에게 맞는 취미를\n고르고 있어요`}
      </AppText>
      <View style={styles.checklist}>
        {lines.map((l) => (
          <CheckLine key={l} text={l} done />
        ))}
        <CheckLine text="540개 활동 중 조건을 통과한 첫 활동 찾는 중" done={false} />
      </View>
      <AppText variant="caption12Medium" color="textOnDarkMuted" align="center">
        보유 물품·비용·전체 시간을 통과한 활동만 추천 카드로 보여요
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgForest, alignItems: 'center', gap: 18, paddingHorizontal: 28 },
  ring: {
    width: 210,
    height: 210,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: COLORS.bgForest2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklist: { alignSelf: 'stretch', gap: 10, padding: 18, borderRadius: 24, backgroundColor: COLORS.bgForest2 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: COLORS.paletteKhaki },
  dotPending: { borderWidth: 2, borderColor: COLORS.brandMid },
});
