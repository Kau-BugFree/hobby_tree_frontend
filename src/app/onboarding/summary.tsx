/**
 * O-05-2 정보 종합 · 추천 준비
 * - 체험 모드: Figma AFTER_TIMEOUT 1.6s → O-06
 * - 로그인 상태: API-10 선택지·설문 → API-12·11 14문항 설문 저장 → API-12 재조회 확인 → API-13 온보딩 완료(약관) → API-14 추천 생성
 *   응답이 오면 O-06 (최소 1.6초 노출). 실패하면 이 화면에서 '다시 시도' / '기본 추천으로 보기'
 *   약관이 바뀌었으면 '약관 다시 확인'
 *   ‘다시 시도’ → API-10을 새로 조회한 뒤 저장부터 다시 (prepareRecommendation)
 */
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, errorMessage } from '../../api/client';
import { engineStatusOf, hobbyKeyOf } from '../../api/mappers';
import { AppText, Button, IconSlot, TreeStage } from '../../components';
import type { HobbyKey } from '../../components/Graphics';
import { useAppState } from '../../lib/appState';
import { AgreementsNeededError, lastStep, prepareRecommendation } from '../../lib/onboardingFlow';
import { useSession } from '../../lib/session';
import { summarize } from '../../lib/summary';
import { COLORS } from '../../theme';

/** 처음에 미리 골라 둘 추천 개수 */
const PRESELECT = 3;

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
  const { state, update, updateServer } = useAppState();
  const { signedIn, memberStatus, setMemberStatus } = useSession();
  const s = summarize(state);
  const [error, setError] = useState<string | null>(null);
  const [needTerms, setNeedTerms] = useState(false);
  // 회원 상태는 화면에 들어온 시점 값으로만 판단 (API-13 뒤 ACTIVE로 바뀌어도 다시 실행하지 않음)
  const memberStatusRef = useRef(memberStatus);
  const [attempt, setAttempt] = useState(0);

  const run = useCallback(async () => {
    const wait = new Promise((r) => setTimeout(r, MIN_WAIT_MS));
    if (!signedIn) {
      await wait;
      return true;
    }
    try {
      const [prepared] = await Promise.all([
        prepareRecommendation(state, state.server.agreements, memberStatusRef.current !== 'ACTIVE', state.server.ageRange, state.server.nickname),
        wait,
      ]);
      if (prepared.memberStatus) {
        memberStatusRef.current = prepared.memberStatus;
        setMemberStatus(prepared.memberStatus);
      }
      // 추천 후보가 있는 결과(recommended)일 때만 미리 고른다 — browse·needs_review·no_match는 O-06에서 상태별 안내
      const items = engineStatusOf(prepared.recommendation) === 'recommended' ? (prepared.recommendation?.items ?? []) : [];
      const pickedHobbyIds = items.slice(0, PRESELECT).map((i) => i.hobbyId);
      updateServer({
        options: prepared.options,
        preferencesVersion: prepared.preferencesVersion,
        recommendation: prepared.recommendation,
        pickedHobbyIds,
      });
      const keys = items.filter((i) => pickedHobbyIds.includes(i.hobbyId)).map((i) => hobbyKeyOf(i.hobbyCode ?? i.name));
      update({ picked: Array.from(new Set<HobbyKey>(keys)) });
      return true;
    } catch (e) {
      setNeedTerms(e instanceof AgreementsNeededError);
      setError(
        e instanceof AgreementsNeededError
          ? e.message
          : `${lastStep ? `${lastStep} 단계에서 멈췄어요\n` : ''}${errorMessage(e)}${e instanceof ApiError ? ` (${e.code})` : ''}`,
      );
      return false;
    }
    // state는 화면에 들어온 시점의 답변으로 한 번만 보낸다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn]);

  useEffect(() => {
    let alive = true;
    setError(null);
    run().then((ok) => {
      if (alive && ok) router.replace('/onboarding/recommend');
    });
    return () => {
      alive = false;
    };
  }, [run, attempt]);

  const lines = [
    `상태·관심 · 시작 전 · ${s.interests}`,
    `예산 · 첫 활동 ${s.firstSpendShort} · 이번 달 ${s.monthly}`,
    `시간 · 한 번에 ${s.sessionShort} · ${s.weeklyShort}`,
    `물건·환경 · ${s.place} · ${s.exclude} 제외 · ${s.company}`,
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.ring}>
        {error ? null : <ActivityIndicator size="large" color={COLORS.paletteKhaki} style={StyleSheet.absoluteFill} />}
        <TreeStage stage={1} scale={0.62} />
      </View>
      <AppText variant="title22Bold" color="textOnDark" align="center">
        {`${state.userName} 님에게 맞는 취미를\n고르고 있어요`}
      </AppText>
      <View style={styles.checklist}>
        {lines.map((l) => (
          <CheckLine key={l} text={l} done />
        ))}
        <CheckLine text={error ? '추천을 받아 오지 못했어요' : '540개 활동 중 조건을 통과한 첫 활동 찾는 중'} done={false} />
      </View>
      {error ? (
        <View style={styles.error}>
          <AppText variant="caption12Medium" color="textOnDarkMuted" align="center">
            {error}
          </AppText>
          {needTerms ? (
            <Button variant="secondary" label="약관 다시 확인" onPress={() => router.replace('/onboarding/terms')} />
          ) : (
            <Button variant="secondary" label="다시 시도" onPress={() => setAttempt((a) => a + 1)} />
          )}
          <Button variant="ghost" label="기본 추천으로 보기" onPress={() => router.replace('/onboarding/recommend')} />
        </View>
      ) : (
        <AppText variant="caption12Medium" color="textOnDarkMuted" align="center">
          보유 물품·비용·전체 시간을 통과한 활동만 추천 카드로 보여요
        </AppText>
      )}
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
  error: { alignSelf: 'stretch', gap: 10 },
});
