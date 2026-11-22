/**
 * E-02 서버판 · 취미 단계와 단계별 활동
 *   API-23 단계 목록 → 칩으로 단계 고르기 → API-24 단계별 활동 (커서 ‘더 보기’)
 *   나무가 있으면(userHobbyId) API-22 로드맵으로 완료·현재·잠김 표시
 *   활동 → 활동 상세(API-25)
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '../../api/client';
import { getRoadmap, listStageActivities, listStages } from '../../api/endpoints';
import { DIFFICULTY_LABEL, hobbyKeyOf, PLACE_LABEL } from '../../api/mappers';
import type { ActivitySummary, HobbyStage, StageState } from '../../api/types';
import { formatWon } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { HobbyIcon } from '../Graphics';
import { IconSlot } from '../IconSlot';
import { Tag } from '../Tag';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';

const STATE_LABEL: Record<StageState, string> = { COMPLETED: '완료', CURRENT: '지금 단계', LOCKED: '잠김' };

export function ServerStage({ hobbyId, userHobbyId, stageId: initialStageId, hobbyName }: { hobbyId: number; userHobbyId?: number; stageId?: number; hobbyName?: string }) {
  const insets = useSafeAreaInsets();
  const [stages, setStages] = useState<HobbyStage[] | null>(null);
  const [name, setName] = useState(hobbyName ?? '');
  const [states, setStates] = useState<Record<number, StageState>>({});
  const [stageId, setStageId] = useState<number | null>(initialStageId ?? null);
  const [items, setItems] = useState<ActivitySummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 단계 목록 + (나무가 있으면) 로드맵 상태
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [list, roadmap] = await Promise.all([listStages(hobbyId), userHobbyId ? getRoadmap(userHobbyId).catch(() => null) : Promise.resolve(null)]);
        if (!alive) return;
        setStages(list.stages ?? []);
        if (list.hobbyName) setName(list.hobbyName);
        const st: Record<number, StageState> = {};
        for (const s of roadmap?.stages ?? []) st[s.stageId] = s.state;
        setStates(st);
        const current = roadmap?.stages?.find((s) => s.state === 'CURRENT')?.stageId;
        setStageId((prev) => prev ?? current ?? list.stages?.[0]?.stageId ?? null);
      } catch (e) {
        if (alive) setError(errorMessage(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [hobbyId, userHobbyId]);

  const loadPage = useCallback(
    async (id: number, after: string | null) => {
      setLoading(true);
      try {
        const res = await listStageActivities(id, after, 20);
        setItems((prev) => (after ? [...prev, ...(res.items ?? [])] : (res.items ?? [])));
        setCursor(res.nextCursor ?? null);
        setHasNext(!!res.hasNext);
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (stageId) loadPage(stageId, null);
  }, [stageId, loadPage]);

  const key = hobbyKeyOf(name);
  const current = stages?.find((s) => s.stageId === stageId);

  const header = (
    <View style={styles.head}>
      <View style={styles.rowGap6}>
        <HobbyIcon hobby={key} size={18} />
        <AppText variant="title22Bold" color="brandDeep">
          {name || '취미'}
        </AppText>
      </View>
      <View style={styles.chips}>
        {(stages ?? []).map((s) => {
          const on = s.stageId === stageId;
          const st = states[s.stageId];
          return (
            <Touchable key={s.stageId} accessibilityState={{ selected: on }} onPress={() => setStageId(s.stageId)} style={[styles.chip, on && styles.chipOn]}>
              <AppText variant="caption12Bold" color={on ? 'textOnDark' : 'textBody'}>
                {`${s.stageNumber}단계 ${s.name}`}
              </AppText>
              {st ? (
                <AppText variant="micro11Bold" color={on ? 'paletteKhaki' : 'textMuted'}>
                  {STATE_LABEL[st]}
                </AppText>
              ) : null}
            </Touchable>
          );
        })}
      </View>
      {current ? (
        <View style={styles.stageInfo}>
          {current.description ? (
            <AppText variant="callout14Regular" color="textBody">
              {current.description}
            </AppText>
          ) : null}
          <AppText variant="caption12Medium" color="textMuted">
            {`활동 ${current.activityCount ?? items.length}개${current.unlockAtDistinctCompletedCount ? ` · 활동 ${current.unlockAtDistinctCompletedCount}개를 마치면 열려요` : ''}`}
          </AppText>
          {states[current.stageId] === 'LOCKED' ? (
            <AppText variant="caption12Bold" color="brandPrimary">
              아직 잠긴 단계예요 · 미리 둘러볼 수 있어요
            </AppText>
          ) : null}
        </View>
      ) : null}
      {error ? (
        <AppText variant="caption12Medium" color="accentDanger">
          {error}
        </AppText>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar title="단계별 활동" />
      {stages === null && !error ? (
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.brandPrimary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => String(a.activityId)}
          ListHeaderComponent={header}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item }) => (
            <Touchable
              accessibilityLabel={item.title}
              onPress={() => go(`/experience/detail?activityId=${item.activityId}${userHobbyId ? `&userHobbyId=${userHobbyId}` : ''}`)}
              style={styles.row}
            >
              <View style={styles.flex}>
                <AppText variant="body16Bold" color="textPrimary">
                  {item.title}
                </AppText>
                <View style={styles.meta}>
                  {item.durationMinutes ? <Tag label={`${item.durationMinutes}분`} tone="khaki" /> : null}
                  {item.estimatedCost != null ? <Tag label={item.estimatedCost ? formatWon(item.estimatedCost) : '0원'} tone="gray" /> : null}
                  {item.difficulty ? <Tag label={DIFFICULTY_LABEL[item.difficulty]} tone="gray" /> : null}
                  {item.indoorOutdoor ? <Tag label={PLACE_LABEL[item.indoorOutdoor]} tone="gray" /> : null}
                </View>
              </View>
              {item.isSaved ? <IconSlot name="bookmark" size={16} color="brandPrimary" /> : null}
              <IconSlot name="chev" size={16} color="textMuted" />
            </Touchable>
          )}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator color={COLORS.brandPrimary} />
            ) : (
              <AppText variant="callout14Regular" color="textMuted" align="center">
                이 단계에는 아직 활동이 없어요
              </AppText>
            )
          }
          ListFooterComponent={hasNext ? <Button label={loading ? '불러오는 중…' : '더 보기'} variant="outline" disabled={loading} onPress={() => stageId && loadPage(stageId, cursor)} /> : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { gap: 10, paddingHorizontal: 24 },
  head: { gap: 12, paddingTop: 8, paddingBottom: 6 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  chipOn: { backgroundColor: COLORS.bgForest, borderColor: COLORS.bgForest },
  stageInfo: { gap: 4, padding: 14, borderRadius: 18, backgroundColor: COLORS.bgKhaki },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
});
