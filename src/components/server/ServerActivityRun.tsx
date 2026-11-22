/**
 * H-07 서버판 · 활동 진행
 *   진입: activityId(+userHobbyId) → API-26 활동 시작(같은 활동 진행 중이면 기존 기록 reused)
 *         recordId만 있으면 → API-27 진행 상황
 *   단계 체크 → API-28 (완료 목록 전체 교체 · expectedVersion, 버전 충돌이면 다시 읽기)
 *   다 했어요 → H-04 기록 시트(API-29)
 * ⚠ 26~30은 배포 서버에 아직 없다(2026-11 기준) → 404 등으로 실패하면 API-25 단계로 ‘이 기기에서만’ 진행하고 안내한다
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ApiError } from '../../api/client';
import { getActivity, getActivityRecord, saveActivityProgress, startActivity } from '../../api/endpoints';
import type { ActivityStep } from '../../api/types';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AskCoachButton, DoneButton, StepList, TimerCard } from '../activity/ActivityParts';
import { AppText } from '../AppText';
import { InfoNote } from '../Blocks';
import { Screen } from '../Screen';
import { Tag } from '../Tag';
import { useToast } from '../Toast';
import { TopBar } from '../TopBar';

interface RunState {
  title: string;
  description?: string;
  steps: ActivityStep[];
  done: number[];
  recordId: number | null;
  version: number;
  /** 서버 기록 없이 이 기기에서만 진행 중 */
  localOnly: boolean;
  canUpdate: boolean;
}

export function ServerActivityRun({ userHobbyId, activityId, recordId }: { userHobbyId?: number; activityId?: number; recordId?: number }) {
  const toast = useToast();
  const { trees, reload } = useForest();
  const tree = trees.find((t) => t.server?.userHobbyId === userHobbyId);
  const [run, setRun] = useState<RunState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(Date.now());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 1) 서버 기록 (시작 또는 이어하기)
        let rec: { recordId: number; version: number; completedStepIds?: number[]; activityId: number; canUpdate?: boolean; steps?: ActivityStep[]; title?: string } | null = null;
        try {
          if (recordId) rec = await getActivityRecord(recordId);
          else if (userHobbyId && activityId) rec = await startActivity(userHobbyId, activityId);
        } catch (e) {
          // 이미 다른 활동을 진행 중 → 그 활동을 먼저 마무리
          if (e instanceof ApiError && e.code === 'RECORD409_1') throw e;
          if (e instanceof ApiError && (e.code === 'TREE409_4' || e.code === 'ACTIVITY403_1')) throw e;
          rec = null; // 미배포 등 → 이 기기에서만 진행
        }
        // 2) 활동 내용 (기록 스냅샷 우선)
        const id = rec?.activityId ?? activityId;
        const detail = id ? await getActivity(id).catch(() => null) : null;
        const steps = [...(rec?.steps ?? detail?.steps ?? [])].sort((a, b) => a.stepNumber - b.stepNumber);
        if (!alive) return;
        setRun({
          title: rec?.title ?? detail?.title ?? '활동',
          description: detail?.description,
          steps,
          done: rec?.completedStepIds ?? [],
          recordId: rec?.recordId ?? null,
          version: rec?.version ?? 0,
          localOnly: !rec,
          canUpdate: rec?.canUpdate ?? true,
        });
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.code === 'RECORD409_1') setError('이 나무에서 진행 중인 다른 활동이 있어요. 그 활동을 먼저 마무리해 주세요.');
        else if (e instanceof ApiError && e.code === 'TREE409_4') setError('쉬거나 종료한 나무에서는 활동을 시작할 수 없어요.');
        else if (e instanceof ApiError && e.code === 'ACTIVITY403_1') setError('아직 열리지 않은 단계의 활동이에요.');
        else setError('활동을 불러오지 못했어요.');
      }
    })();
    return () => {
      alive = false;
    };
  }, [userHobbyId, activityId, recordId]);

  /** API-28 — 버전 충돌(RECORD409_2)이면 최신 기록을 읽어 다시 맞춘다 */
  const toggle = useCallback(
    async (i: number) => {
      if (!run || !run.canUpdate) return;
      const step = run.steps[i];
      const next = run.done.includes(step.stepId) ? run.done.filter((x) => x !== step.stepId) : [...run.done, step.stepId];
      setRun({ ...run, done: next });
      if (run.localOnly || !run.recordId) return;
      try {
        const res = await saveActivityProgress(run.recordId, {
          completedStepIds: next,
          elapsedSeconds: Math.min(86400, Math.round((Date.now() - started.current) / 1000)),
          expectedVersion: run.version,
        });
        setRun((r) => (r ? { ...r, done: res.completedStepIds, version: res.version } : r));
      } catch (e) {
        if (e instanceof ApiError && e.code === 'RECORD409_2') {
          const fresh = await getActivityRecord(run.recordId).catch(() => null);
          if (fresh) setRun((r) => (r ? { ...r, done: fresh.completedStepIds ?? [], version: fresh.version } : r));
          toast({ title: '다른 곳에서 진행이 바뀌었어요', sub: '최신 상태로 맞췄어요', icon: 'info' });
        } else {
          toast({ title: '진행을 저장하지 못했어요', sub: e instanceof ApiError ? `${e.message} (${e.code})` : undefined, icon: 'info' });
        }
      }
    },
    [run, toast],
  );

  if (error || !run) {
    return (
      <Screen header={<TopBar title="지금 하는 활동" />}>
        <View style={styles.center}>
          {error ? (
            <AppText variant="callout14Regular" color="textBody" align="center">
              {error}
            </AppText>
          ) : (
            <ActivityIndicator color={COLORS.brandPrimary} />
          )}
        </View>
      </Screen>
    );
  }

  const doneFlags = run.steps.map((s) => run.done.includes(s.stepId));
  const requiredLeft = run.steps.filter((s) => s.isRequired !== false && !run.done.includes(s.stepId)).length;
  const onFinish = () => {
    if (run.localOnly || !run.recordId) {
      // 서버 기록이 없으면 완료를 저장할 수 없다 → 기록 완료 화면만
      reload();
      return go('/home/record-done');
    }
    go(
      `/home/record?recordId=${run.recordId}&version=${run.version}&title=${encodeURIComponent(run.title)}&userHobbyId=${userHobbyId ?? ''}&requiredLeft=${requiredLeft}`,
    );
  };

  return (
    <Screen header={<TopBar title="지금 하는 활동" />} footer={<DoneButton label="다 했어요 · 기록하기" onPress={onFinish} />}>
      <View style={styles.hero}>
        <View style={styles.tags}>
          {tree ? <Tag label={`${tree.name} · ${tree.server?.stageNumber ?? ''}단계`} tone="solid" /> : null}
        </View>
        <AppText variant="title22Bold" color="brandDeep">
          {run.title}
        </AppText>
        {run.description ? (
          <AppText variant="callout14Regular" color="textBody">
            {run.description}
          </AppText>
        ) : null}
      </View>
      {run.localOnly ? <InfoNote text="활동 기록 API가 아직 서버에 없어 이 기기에서만 진행돼요. 완료해도 나무 성장에는 반영되지 않아요." /> : null}
      {!run.canUpdate ? <InfoNote text="쉬거나 종료한 나무라 진행을 바꿀 수 없어요." /> : null}
      <StepList steps={run.steps.map((s) => ({ title: s.title, sub: s.description ?? '' }))} done={doneFlags} onToggle={toggle} />
      <TimerCard initial="00:00" label={`하는 중 · 할 일 ${run.steps.length}개 중 ${doneFlags.filter(Boolean).length}개 완료`} />
      <AskCoachButton />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  hero: { gap: 8, padding: 20, borderRadius: 30, backgroundColor: COLORS.bgKhaki },
  tags: { flexDirection: 'row', gap: 6 },
});
