/**
 * E-02 로그인 상태 · 단계별 세부 활동 — 화면은 Figma v6 E-02와 같은 StageListView
 *   API-23 취미 단계 목록 → 고른 단계(stageId, 없으면 내 나무의 현재 단계)
 *   API-24 그 단계의 활동 (마지막 페이지에 오면 커서로 다음 활동)
 *   API-22 내 나무가 있으면 완료·현재·잠김 상태를 요약 줄에 표시
 *   다른 취미 토글 → 내 서버 나무들 사이 이동
 */
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { getRoadmap, listStageActivities, listStages } from '../../api/endpoints';
import { DIFFICULTY_LABEL, hobbyKeyOf, hobbyLabel, PLACE_LABEL } from '../../api/mappers';
import type { ActivitySummary, HobbyStage, StageState } from '../../api/types';
import { formatWon } from '../../lib/appState';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { StageListView } from '../activity/StageListView';
import { AppText } from '../AppText';
import { Button } from '../Button';
import type { HobbyKey, TreeStageNo } from '../Graphics';
import { STAGE_NAME } from '../Graphics';
import { TopBar } from '../TopBar';

const STATE_TEXT: Record<StageState, string> = { COMPLETED: '완료한 단계', CURRENT: '지금 단계', LOCKED: '아직 잠긴 단계 · 미리 보기' };

export function ServerStage({ hobbyId, userHobbyId, stageId: wantStageId, hobbyName }: { hobbyId: number; userHobbyId?: number; stageId?: number; hobbyName?: string }) {
  const { trees } = useForest();
  const [stage, setStage] = useState<HobbyStage | null>(null);
  const [name, setName] = useState(hobbyLabel(hobbyName));
  const [state, setState] = useState<StageState | null>(null);
  const [items, setItems] = useState<ActivitySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const cursor = useRef<string | null>(null);
  const hasNext = useRef(false);
  const busy = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, roadmap] = await Promise.all([listStages(hobbyId), userHobbyId ? getRoadmap(userHobbyId).catch(() => null) : Promise.resolve(null)]);
      const stages = list.stages ?? [];
      if (list.hobbyName) setName(hobbyLabel(list.hobbyName));
      const currentId = roadmap?.stages?.find((x) => x.state === 'CURRENT')?.stageId;
      const picked = stages.find((x) => x.stageId === (wantStageId ?? currentId)) ?? stages[0] ?? null;
      setStage(picked);
      setState(roadmap?.stages?.find((x) => x.stageId === picked?.stageId)?.state ?? null);
      if (picked) {
        const res = await listStageActivities(picked.stageId, null, 50);
        setItems(res.items ?? []);
        cursor.current = res.nextCursor ?? null;
        hasNext.current = !!res.hasNext;
      } else {
        setItems([]);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [hobbyId, userHobbyId, wantStageId]);

  useEffect(() => {
    load();
  }, [load]);

  const more = useCallback(async () => {
    if (!stage || !hasNext.current || busy.current) return;
    busy.current = true;
    try {
      const res = await listStageActivities(stage.stageId, cursor.current, 50);
      setItems((prev) => [...prev, ...(res.items ?? [])]);
      cursor.current = res.nextCursor ?? null;
      hasNext.current = !!res.hasNext;
    } catch {
      // 더 불러오기 실패는 조용히 — 지금 목록은 그대로
    } finally {
      busy.current = false;
    }
  }, [stage]);

  if (error) {
    return (
      <View style={styles.root}>
        <TopBar title="세부 활동" />
        <View style={styles.center}>
          <AppText variant="callout14Regular" color="textBody" align="center">
            {error}
          </AppText>
          <Button label="다시 시도" variant="outline" hug onPress={load} />
        </View>
      </View>
    );
  }
  if (!stage && loading) {
    return (
      <View style={styles.root}>
        <TopBar title="세부 활동" />
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.brandPrimary} />
        </View>
      </View>
    );
  }

  const hobby = hobbyKeyOf(name);
  const treeStage = Math.max(0, Math.min(5, stage?.stageNumber ?? 1)) as TreeStageNo;
  // 다른 취미 토글: 내 서버 나무들
  const mine = trees.filter((t) => t.server);
  const options = Array.from(new Set(mine.map((t) => t.hobby))) as HobbyKey[];

  return (
    <StageListView
      m={{
        title: stage?.name ?? '세부 활동',
        hobby,
        treeStage,
        eyebrow: `${name || hobby} · ${stage ? `${stage.stageNumber}단계` : STAGE_NAME[treeStage]}`,
        summary: [stage?.description, `활동 ${stage?.activityCount ?? items.length}개`, state ? STATE_TEXT[state] : null].filter(Boolean).join(' · '),
        cards: items.map((a) => ({
          id: String(a.activityId),
          title: a.title,
          tag: a.difficulty ? DIFFICULTY_LABEL[a.difficulty] : `${stage?.stageNumber ?? ''}단계`,
          minutes: a.durationMinutes,
          goal: [a.indoorOutdoor ? PLACE_LABEL[a.indoorOutdoor] : null, a.estimatedCost != null ? (a.estimatedCost ? formatWon(a.estimatedCost) : '0원') : null].filter(Boolean).join(' · '),
          searchText: a.title,
          saved: a.isSaved,
          onPress: () => go(`/experience/detail?activityId=${a.activityId}${userHobbyId ? `&userHobbyId=${userHobbyId}` : ''}`),
        })),
        hobbyOptions: options.length ? options : [hobby],
        onChangeHobby: (h) => {
          const t = mine.find((x) => x.hobby === h);
          if (!t?.server) return;
          router.setParams({
            hobbyId: String(t.server.hobbyId),
            userHobbyId: String(t.server.userHobbyId),
            stageId: t.server.currentStageId ? String(t.server.currentStageId) : '',
            hobby: t.name,
          });
        },
        onEndReached: more,
        loading,
        emptyText: '이 단계에는 아직 활동이 없어요',
      }}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgApp, paddingTop: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
});
