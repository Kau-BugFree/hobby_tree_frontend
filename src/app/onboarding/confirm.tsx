/**
 * O-06-1 고른 취미 추가 확인 · B01~B06
 * - 고른 취미마다 "Check/…" 카드 → HobbyCheckCard 서브 컴포넌트
 * - 다음: O-07 나무 심기 완료 (약관 동의·온보딩 완료는 추천 전에 끝남)
 * 로그인 상태: ‘확인하고 나무 심기’ → 고른 취미마다 API-19 나무 심기 (recommendationId 함께)
 *   이미 같은 취미 나무가 있으면(TREE409_2) 심어진 것으로 보고 넘어간다. 5그루 초과(TREE409_1)면 안내
 */
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ChipGroup, HobbyIcon, IconTile, InfoNote, Screen } from '../../components';
import { AppTextProps } from '../../components/AppText';
import { OnboardingBar, StepTitle } from '../../components/onboarding/OnboardingParts';
import type { HobbyKey } from '../../components/Graphics';
import { HOBBY_CHECKS, RECOMMENDED } from '../../data/onboarding';
import { useAppState } from '../../lib/appState';
import { plantErrorMessage, useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { useToast } from '../../components';
import { Button } from '../../components/Button';
import { Touchable } from '../../components/Touchable';
import { COLORS } from '../../theme';

const STEP = {
  eyebrow: '추가 확인 · 고른 취미에 꼭 필요한 것만',
  title: '시작 전에\n몇 가지만 확인할게요',
  lead: '모르면 ‘미확인’으로 두고 나중에 정해도 돼요.',
};

function CodeBadge({ code }: { code: string }) {
  return (
    <View style={styles.badge}>
      <AppText variant="micro11Bold" color="brandDeep">
        {code}
      </AppText>
    </View>
  );
}

function HobbyCheckCard({ hobby }: { hobby: HobbyKey }) {
  const { state, update } = useAppState();
  const def = HOBBY_CHECKS[hobby];
  const name = RECOMMENDED.find((r) => r.hobby === hobby)?.name ?? hobby;
  return (
    <Card radius={24} gap={12}>
      <View style={styles.head}>
        <IconTile size={32} radius={12}>
          <HobbyIcon hobby={hobby} size={18} />
        </IconTile>
        <AppText variant="body16Bold" color="textPrimary" style={styles.flex}>
          {`${name} · 첫 활동 ‘${def.firstActivity}’`}
        </AppText>
      </View>
      {def.checks.map((c) => {
        const key = `${hobby}:${c.code}`;
        return (
          <View key={key} style={styles.check}>
            <View style={styles.checkHead}>
              <CodeBadge code={c.code} />
              <AppText variant="callout14Bold" color="textBody" style={styles.flex}>
                {c.title}
              </AppText>
            </View>
            <ChipGroup
              options={c.options}
              value={state.hobbyChecks[key] ?? null}
              onChange={(v) => update({ hobbyChecks: { ...state.hobbyChecks, [key]: v } })}
            />
          </View>
        );
      })}
      {def.note ? <InfoNote text={def.note} /> : null}
    </Card>
  );
}

const NOTE_LINES: { text: string; variant: AppTextProps['variant'] }[] = [
  { text: 'B05 · 러닝처럼 몸을 쓰는 활동은 시작 전 검토된 안내만 확인해요. 병력·진단명은 묻지 않아요.', variant: 'caption12Medium' },
  { text: 'B06 · 몇 번 해볼지는 계획을 세울 때만, 이번 달 남은 기간 기준으로 물어요.', variant: 'caption12Medium' },
];

export default function OnboardingConfirm() {
  const { state } = useAppState();
  const { signedIn } = useSession();
  const { plant, reload } = useForest();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  /** 고른 서버 취미를 차례로 심는다 → 성공하면 O-07 */
  const onPlant = async () => {
    const ids = state.server.pickedHobbyIds;
    if (!signedIn || !ids.length) return go('/onboarding/planted');
    setBusy(true);
    try {
      for (const id of ids) await plant(id, state.server.recommendation?.recommendationId);
      reload();
      go('/onboarding/planted');
    } catch (e) {
      toast({ title: '나무를 심지 못했어요', sub: plantErrorMessage(e), icon: 'info' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<OnboardingBar progress="4/4" filled={4} />}
      footer={
        <>
          <Button label={busy ? '나무 심는 중…' : '확인하고 나무 심기'} disabled={busy} onPress={onPlant} />
          <Touchable small disabled={busy} onPress={onPlant} style={styles.later}>
            <AppText variant="callout14Bold" color="textMuted">
              나중에 확인할게요
            </AppText>
          </Touchable>
        </>
      }
      contentStyle={styles.content}
    >
      <StepTitle step={STEP} />
      <View style={styles.cards}>
        {state.picked.map((h) => (
          <HobbyCheckCard key={h} hobby={h} />
        ))}
        <View style={styles.note}>
          {NOTE_LINES.map((l) => (
            <AppText key={l.text} variant={l.variant} color="textBody">
              {l.text}
            </AppText>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 18 },
  cards: { gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  check: { gap: 8 },
  checkHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { backgroundColor: COLORS.bgKhaki, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
  note: { gap: 6, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.bgGreenSoft },
  later: { paddingVertical: 6 },
});
