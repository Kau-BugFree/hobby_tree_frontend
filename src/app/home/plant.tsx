/**
 * H-09 새 나무 심기
 * - 남은 자리(Slots) · 다른 취미 찾기(→ E-04) · 심을 취미 단일 선택 · 조건 불일치 취미 · B05 확인
 * 로그인 상태:
 *   - 남은 자리: API-18 (ACTIVE+PAUSED / maxTreeCount)
 *   - 후보: API-15 최근 추천 중 아직 안 심은 취미 → 부족하면 API-16 전체 취미(isPlanted=false)
 *   - 심기: API-19 (추천 후보면 recommendationId 함께) → H-10
 *   - ?pick=hobbyId 로 들어오면(취미 상세·탐색) 그 취미를 골라 둔다
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  ChipGroup,
  Choice,
  IconSlot,
  Screen,
  Tag,
  TopBar,
  Touchable,
  TreeStage,
  useToast,
} from '../../components';
import { listHobbies } from '../../api/endpoints';
import { criteriaLabel } from '../../api/mappers';
import { PLANT_CANDIDATES } from '../../data/hobbies';
import { useAppState } from '../../lib/appState';
import { plantErrorMessage, useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { latestRecommendation } from '../../lib/onboardingFlow';
import { COLORS } from '../../theme';

const B05 = ['확인했어요', '아직이에요'] as const;

interface Candidate {
  id: string;
  name: string;
  /** 선택지 한 줄 */
  line: string;
  firstActivity: string;
  available: boolean;
  reason?: string;
  hobbyId?: number;
  recommendationId?: number;
  /** 몸을 쓰는 취미 → B05 확인 */
  physical?: boolean;
}

const fromMock = (): Candidate[] =>
  PLANT_CANDIDATES.map((c) => ({
    id: c.id,
    name: c.name,
    line: `${c.name} · 맞춤 ${c.match}% · 0단계 ‘${c.firstActivity}’`,
    firstActivity: c.firstActivity,
    available: c.available,
    reason: c.reason,
    physical: c.id === 'running',
  }));

/** 서버 후보: 최근 추천(API-15) → 전체 취미(API-16), 이미 심은 취미는 뺀다 */
async function loadServerCandidates(planted: number[]): Promise<Candidate[]> {
  const out: Candidate[] = [];
  const rec = await latestRecommendation().catch(() => null);
  for (const i of rec?.items ?? []) {
    if (planted.includes(i.hobbyId)) continue;
    const tags = (i.matchedCriteria ?? []).slice(0, 2).map(criteriaLabel).join(' · ');
    out.push({
      id: String(i.hobbyId),
      name: i.name,
      line: `${i.name} · 추천${tags ? ` · ${tags}` : ''}`,
      firstActivity: '',
      available: true,
      hobbyId: i.hobbyId,
      recommendationId: rec?.recommendationId,
      physical: /러닝|걷기|달리기/.test(i.name),
    });
  }
  const all = await listHobbies({ size: 50 }).catch(() => null);
  for (const h of all?.items ?? []) {
    if (h.isPlanted || planted.includes(h.hobbyId) || out.some((c) => c.hobbyId === h.hobbyId)) continue;
    const meta = [h.minDurationMinutes ? `${h.minDurationMinutes}분부터` : '', h.minCost != null ? (h.minCost ? `${h.minCost.toLocaleString()}원부터` : '0원부터') : '']
      .filter(Boolean)
      .join(' · ');
    out.push({
      id: String(h.hobbyId),
      name: h.name,
      line: `${h.name}${meta ? ` · ${meta}` : ''}`,
      firstActivity: '',
      available: true,
      hobbyId: h.hobbyId,
      physical: /러닝|걷기|달리기/.test(h.name),
    });
  }
  return out;
}

function SlotsCard() {
  const { trees, maxTrees } = useForest();
  const empty = Math.max(0, maxTrees - trees.length);
  return (
    <View style={styles.slots}>
      <AppText variant="body16Bold" color="brandDeep">
        {`지금 ${trees.length}그루 · ${empty}자리 남았어요`}
      </AppText>
      <View style={styles.slotRow}>
        {trees.map((t) => (
          <View key={String(t.server?.userHobbyId ?? t.hobby)} style={styles.slot}>
            <TreeStage stage={t.stage} scale={46 / 300} />
          </View>
        ))}
        {/* 빈 자리는 + 아이콘 없이 점선 테두리만 보여 준다 */}
        {Array.from({ length: empty }).map((_, i) => (
          <View key={`empty-${i}`} accessibilityLabel="빈 자리" style={[styles.slot, styles.slotEmpty]} />
        ))}
      </View>
      <AppText variant="caption12Medium" color="textBody">
        {`나무는 최대 ${maxTrees}그루까지 키울 수 있어요 · 쉬는 나무도 자리를 차지해요`}
      </AppText>
    </View>
  );
}

export default function PlantScreen() {
  const { state } = useAppState();
  const { live, trees, maxTrees, plantedHobbyIds, plant, reload } = useForest();
  const toast = useToast();
  const params = useLocalSearchParams<{ pick?: string }>();
  const [server, setServer] = useState<Candidate[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!live) return;
    let alive = true;
    loadServerCandidates(plantedHobbyIds).then((c) => alive && setServer(c));
    return () => {
      alive = false;
    };
    // 심은 목록이 바뀌면 다시
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, plantedHobbyIds.join(',')]);

  const candidates = useMemo(() => (live ? (server ?? []) : fromMock()), [live, server]);
  const available = candidates.filter((c) => c.available);
  const unavailable = candidates.filter((c) => !c.available);
  const [pick, setPick] = useState<string | null>(params.pick ?? null);
  const picked = available.find((c) => c.id === pick) ?? available[0];
  const [b05, setB05] = useState<(typeof B05)[number]>('확인했어요');
  const full = trees.length >= maxTrees;

  const onPlant = async () => {
    if (!picked) return;
    const done = () =>
      go(`/home/planted?name=${encodeURIComponent(picked.name)}${picked.firstActivity ? `&first=${encodeURIComponent(picked.firstActivity)}` : ''}`);
    if (!live || !picked.hobbyId) return done();
    setBusy(true);
    try {
      await plant(picked.hobbyId, picked.recommendationId);
      await reload();
      done();
    } catch (e) {
      toast({ title: '나무를 심지 못했어요', sub: plantErrorMessage(e), icon: 'info' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<TopBar title="새 나무 심기" />}
      footer={
        <Button
          label={full ? `${maxTrees}그루를 모두 키우고 있어요` : busy ? '나무 심는 중…' : '고른 취미로 나무 심기'}
          disabled={!picked || busy || full || (!!picked.physical && b05 !== '확인했어요')}
          onPress={onPlant}
        />
      }
    >
      <SlotsCard />
      <Touchable accessibilityLabel="다른 취미 찾아보기" onPress={() => go('/experience/explore')} style={styles.search}>
        <IconSlot name="search" size={18} color="textMuted" />
        <AppText variant="callout14Regular" color="textMuted" style={styles.flex}>
          다른 취미 찾아보기
        </AppText>
        <IconSlot name="chev" size={16} color="textMuted" />
      </Touchable>
      <AppText variant="headline18Bold" color="textPrimary">
        {`${state.userName} 님 조건에 맞는 취미`}
      </AppText>
      {live && server === null ? <ActivityIndicator color={COLORS.brandPrimary} /> : null}
      {live && server?.length === 0 ? (
        <AppText variant="callout14Regular" color="textMuted">
          심을 수 있는 취미를 모두 심었어요. 다른 취미가 추가되면 여기에 보여요.
        </AppText>
      ) : null}
      <View style={styles.choices}>
        {available.map((c) => (
          <Choice key={c.id} label={c.line} selected={picked?.id === c.id} onPress={() => setPick(c.id)} />
        ))}
      </View>
      {unavailable.map((c) => (
        <View key={c.id} style={styles.unavailable} accessibilityState={{ disabled: true }}>
          <View style={styles.rowGap6}>
            <AppText variant="callout14Bold" color="textMuted">
              {c.line}
            </AppText>
            <Tag label="지금은 어려워요" tone="gray" />
          </View>
          <AppText variant="caption12Medium" color="textMuted">
            {c.reason}
          </AppText>
        </View>
      ))}
      <AppText variant="caption12Medium" color="textMuted">
        1단계 맛보기 활동부터 시작해요. 몸을 쓰는 취미를 고르면 시작 전 안내를 한 번 확인해요.
      </AppText>
      {picked?.physical ? (
        <View style={styles.b05}>
          <View style={styles.rowGap6}>
            <View style={styles.badge}>
              <AppText variant="micro11Bold" color="brandDeep">
                B05
              </AppText>
            </View>
            <AppText variant="callout14Bold" color="brandDeep">
              {`${picked.name} 시작 안내를 확인했나요?`}
            </AppText>
          </View>
          <AppText variant="caption12Medium" color="textBody">
            몸을 쓰는 활동이라 시작 전 검토된 안내만 확인해요. 병력·진단명은 묻지 않아요.
          </AppText>
          <ChipGroup options={B05} value={b05} onChange={setB05} />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slots: { gap: 10, padding: 16, borderRadius: 24, backgroundColor: COLORS.bgKhaki },
  slotRow: { flexDirection: 'row', gap: 8 },
  // 고정 58px × 5칸 + 간격이 360dp 화면에서 카드 밖으로 넘쳐 마지막 칸이 잘렸다 → 남은 폭을 나눠 쓰는 정사각형
  slot: {
    flex: 1,
    maxWidth: 58,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    overflow: 'hidden',
  },
  slotEmpty: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: COLORS.borderStrong },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  choices: { gap: 8 },
  unavailable: { gap: 2, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.bgSunken },
  b05: { gap: 8, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 20, backgroundColor: COLORS.bgGreenSoft },
  badge: { backgroundColor: COLORS.bgKhaki, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
});
