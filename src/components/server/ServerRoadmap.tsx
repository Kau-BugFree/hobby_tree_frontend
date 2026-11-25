/**
 * M-02 로그인 상태 · 나무 로드맵 + 나무 관리 — 화면은 Figma v6 M-02와 같은 RoadmapView
 *   API-20 상세(성장 현황) · API-22 로드맵(완료·현재·잠김) · API-23 단계별 활동 수 · API-21 쉬기·다시 키우기·종료
 *   단계 → 단계별 활동(API-24) · 진행 중 활동 → 이어하기
 */
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ApiError, errorMessage } from '../../api/client';
import { getRoadmap, getTree, listStages } from '../../api/endpoints';
import { hobbyKeyOf, hobbyLabel } from '../../api/mappers';
import type { HobbyStage, Roadmap, StageState, TreeStatus, UserHobbyDetail } from '../../api/types';
import { useForest } from '../../lib/forest';
import { go, reset } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { ConfirmModal } from '../ConfirmModal';
import type { TreeStageNo } from '../Graphics';
import { STAGE_NAME } from '../Graphics';
import type { NodeState, RoadmapNode } from '../my/RoadmapView';
import { RoadmapView } from '../my/RoadmapView';
import { Screen } from '../Screen';
import { useToast } from '../Toast';
import { TopBar } from '../TopBar';

const NODE_STATE: Record<StageState, NodeState> = { COMPLETED: 'done', CURRENT: 'current', LOCKED: 'next' };
const STATUS_TEXT: Record<TreeStatus, string> = { ACTIVE: '키우는 중', PAUSED: '쉬는 중', ENDED: '종료' };

const daysSince = (iso?: string) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? null : Math.max(1, Math.floor((Date.now() - t) / 86400000) + 1);
};

export function ServerRoadmap({ userHobbyId }: { userHobbyId: number }) {
  const toast = useToast();
  const { changeStatus } = useForest();
  const [tree, setTree] = useState<UserHobbyDetail | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [counts, setCounts] = useState<Record<number, HobbyStage>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [askEnd, setAskEnd] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [t, r] = await Promise.all([getTree(userHobbyId), getRoadmap(userHobbyId)]);
      setTree(t);
      setRoadmap(r);
      // 단계별 활동 수 (실패해도 로드맵은 보여 준다)
      listStages(t.hobbyId)
        .then((l) => setCounts(Object.fromEntries((l.stages ?? []).map((s) => [s.stageId, s]))))
        .catch(() => undefined);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [userHobbyId]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (status: TreeStatus) => {
    setBusy(true);
    try {
      await changeStatus(userHobbyId, status);
      await load();
      toast({ title: status === 'ACTIVE' ? '다시 키우기 시작했어요' : status === 'PAUSED' ? '나무가 쉬고 있어요' : '나무를 종료했어요', icon: 'check' });
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === 'TREE409_1'
          ? '키우는 나무가 이미 5그루예요. 다른 나무를 종료하면 다시 키울 수 있어요.'
          : errorMessage(e);
      toast({ title: '상태를 바꾸지 못했어요', sub: msg, icon: 'info' });
    } finally {
      setBusy(false);
      setAskEnd(false);
    }
  };

  if (error || !tree) {
    return (
      <Screen header={<TopBar title="나무 로드맵" />}>
        <View style={styles.center}>
          {error ? (
            <>
              <AppText variant="callout14Regular" color="textBody" align="center">
                {error}
              </AppText>
              <Button label="다시 시도" variant="outline" hug onPress={load} />
            </>
          ) : (
            <ActivityIndicator color={COLORS.brandPrimary} />
          )}
        </View>
      </Screen>
    );
  }

  const key = hobbyKeyOf(tree.hobbyName);
  const stageNo = Math.max(0, Math.min(5, tree.currentStageNumber)) as TreeStageNo;
  const cur = tree.currentActivityRecord;
  const stages = [...(roadmap?.stages ?? [])].sort((a, b) => a.stageNumber - b.stageNumber);
  const per = roadmap?.growthRule?.distinctActivitiesPerStage;
  const doneStages = stages.filter((s) => s.state === 'COMPLETED').length;
  const total = tree.totalStages ?? (stages.length || 6);
  const days = daysSince(tree.plantedAt);
  const openStage = (stageId?: number) =>
    go(`/experience/stage?hobbyId=${tree.hobbyId}&userHobbyId=${tree.userHobbyId}&hobby=${encodeURIComponent(tree.hobbyName)}${stageId ? `&stageId=${stageId}` : ''}`);

  const nodes: RoadmapNode[] = stages.map((s) => {
    const state = NODE_STATE[s.state];
    const count = counts[s.stageId]?.activityCount;
    const need = tree.currentStageRequiredCount ?? per;
    const doneHere = tree.currentStageCompletedCount ?? 0;
    const lvl = Math.max(0, Math.min(5, s.stageNumber)) as TreeStageNo;
    return {
      key: String(s.stageId),
      stage: s.stageNumber,
      title: `${s.stageNumber}단계 ${STAGE_NAME[lvl]}${s.name && s.name !== STAGE_NAME[lvl] ? ` · ${s.name}` : ''}`,
      state,
      tag: state === 'done' ? '완료' : need ? `완료 ${doneHere}/${need}` : '지금 단계',
      right: count != null ? `활동 ${count}개` : s.unlockAtDistinctCompletedCount ? `${s.unlockAtDistinctCompletedCount}개 완료 시 열림` : undefined,
      rows:
        state === 'current' && cur
          ? [{ id: `cur-${cur.recordId}`, title: `${cur.title ?? '활동'} · 진행 중 ${cur.progressPercent ?? 0}%`, done: false }]
          : [],
      rest:
        state === 'current' && tree.remainingCountForNextStage != null && !tree.isMaxStage
          ? `${tree.remainingCountForNextStage}개 더 하면 다음 단계`
          : undefined,
      onPress: () => openStage(s.stageId),
    };
  });

  return (
    <>
      <RoadmapView
        m={{
          title: `${hobbyLabel(tree.hobbyName)} 로드맵`,
          treeStage: stageNo,
          plantedTag: tree.plantedAt ? `${tree.plantedAt.slice(0, 10).replace(/-/g, '.')} 심음${days ? ` · ${days}일째` : ''}` : undefined,
          statusTag: tree.treeStatus !== 'ACTIVE' ? STATUS_TEXT[tree.treeStatus] : undefined,
          headline: `${hobbyLabel(tree.hobbyName)} 나무 · ${tree.currentStageNumber}단계 ${tree.currentStageName ?? STAGE_NAME[stageNo]}`,
          sub: tree.isMaxStage
            ? `최고 단계예요 · 전체 완료 ${tree.distinctCompletedActivityCount ?? 0}개`
            : `${tree.currentStageNumber}단계 완료 ${tree.currentStageCompletedCount ?? 0}개 · 전체 완료 ${tree.distinctCompletedActivityCount ?? 0}개`,
          sectionRight: `${doneStages}/${total} 단계 완료`,
          nodes,
          resume: cur
            ? {
                title: `${cur.title ?? '활동'} · ${cur.progressPercent ?? 0}%`,
                onPress: () => go(`/home/activity/${encodeURIComponent(key)}?userHobbyId=${tree.userHobbyId}&recordId=${cur.recordId}&activityId=${cur.activityId}`),
              }
            : undefined,
          footerLabel: `체험에서 ${hobbyLabel(tree.hobbyName)} 활동 전체 보기`,
          onFooter: () => reset('/experience'),
          children: (
            <View style={styles.manage}>
              {tree.treeStatus === 'ACTIVE' ? (
                <Button label="잠시 쉬기" variant="outline" disabled={busy} onPress={() => setStatus('PAUSED')} />
              ) : (
                <Button label="다시 키우기" disabled={busy} onPress={() => setStatus('ACTIVE')} />
              )}
              {tree.treeStatus !== 'ENDED' ? <Button label="이 나무 종료하기" variant="ghost" disabled={busy} onPress={() => setAskEnd(true)} /> : null}
            </View>
          ),
        }}
      />
      <ConfirmModal
        visible={askEnd}
        title="나무를 종료할까요?"
        message="단계와 활동 기록은 그대로 남고, 나중에 다시 키울 수 있어요. 종료하면 자리 하나가 비어요."
        tree={stageNo}
        confirmLabel="종료하기"
        cancelLabel="취소"
        tone="danger"
        busy={busy}
        onConfirm={() => setStatus('ENDED')}
        onCancel={() => setAskEnd(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  manage: { gap: 8, paddingTop: 8 },
});
