/**
 * M-02 서버판 · 나무 성장 로드맵 + 나무 관리
 *   API-20 상세(성장 현황) · API-22 로드맵(완료·현재·잠김) · API-21 일시정지·재개·종료
 *   단계 → 단계별 활동(API-24) · 진행 중 활동 → 이어하기
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { ApiError, errorMessage } from '../../api/client';
import { getRoadmap, getTree } from '../../api/endpoints';
import { hobbyKeyOf } from '../../api/mappers';
import type { Roadmap, StageState, TreeStatus, UserHobbyDetail } from '../../api/types';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { HobbyIcon, TreeStage, TreeStageNo } from '../Graphics';
import { IconSlot } from '../IconSlot';
import { Screen } from '../Screen';
import { Tag } from '../Tag';
import { useToast } from '../Toast';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';

const STATE_TEXT: Record<StageState, string> = { COMPLETED: '완료', CURRENT: '지금 단계', LOCKED: '잠김' };
const STATUS_TEXT: Record<TreeStatus, string> = { ACTIVE: '키우는 중', PAUSED: '쉬는 중', ENDED: '종료' };

export function ServerRoadmap({ userHobbyId }: { userHobbyId: number }) {
  const toast = useToast();
  const { changeStatus } = useForest();
  const [tree, setTree] = useState<UserHobbyDetail | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [t, r] = await Promise.all([getTree(userHobbyId), getRoadmap(userHobbyId)]);
      setTree(t);
      setRoadmap(r);
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
          : e instanceof ApiError
            ? `${e.message} (${e.code})`
            : '상태를 바꾸지 못했어요';
      toast({ title: '상태를 바꾸지 못했어요', sub: msg, icon: 'info' });
    } finally {
      setBusy(false);
    }
  };

  const confirmEnd = () =>
    Alert.alert('나무를 종료할까요?', '단계와 활동 기록은 그대로 남고, 나중에 다시 키울 수 있어요. 종료하면 자리 하나가 비어요.', [
      { text: '취소', style: 'cancel' },
      { text: '종료하기', style: 'destructive', onPress: () => setStatus('ENDED') },
    ]);

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
  const openStage = (stageId?: number) =>
    go(`/experience/stage?hobbyId=${tree.hobbyId}&userHobbyId=${tree.userHobbyId}&hobby=${encodeURIComponent(tree.hobbyName)}${stageId ? `&stageId=${stageId}` : ''}`);

  return (
    <Screen
      header={<TopBar title={`${tree.hobbyName} 로드맵`} />}
      footer={
        <>
          {tree.treeStatus === 'ACTIVE' ? (
            <Button label="잠시 쉬기" variant="secondary" disabled={busy} onPress={() => setStatus('PAUSED')} />
          ) : (
            <Button label="다시 키우기" disabled={busy} onPress={() => setStatus('ACTIVE')} />
          )}
          {tree.treeStatus !== 'ENDED' ? <Button label="이 나무 종료하기" variant="ghost" disabled={busy} onPress={confirmEnd} /> : null}
        </>
      }
      contentStyle={styles.content}
    >
      <LinearGradient colors={[COLORS.bgForest2, COLORS.bgForest]} style={styles.summary}>
        <View style={styles.rowBetween}>
          <View style={styles.rowGap6}>
            <HobbyIcon hobby={key} size={16} color="textOnDark" />
            <AppText variant="callout14Bold" color="textOnDark">
              {`${tree.hobbyName} 나무`}
            </AppText>
          </View>
          <Tag label={STATUS_TEXT[tree.treeStatus]} tone="onDark" />
        </View>
        <View style={styles.art}>
          <TreeStage stage={stageNo} scale={0.5} />
        </View>
        <AppText variant="headline18Bold" color="textOnDark">
          {`${tree.currentStageNumber}단계${tree.currentStageName ? ` · ${tree.currentStageName}` : ''}${tree.totalStages ? ` / 전체 ${tree.totalStages}단계` : ''}`}
        </AppText>
        <AppText variant="caption12Medium" color="textOnDarkMuted">
          {tree.isMaxStage
            ? `완료 ${tree.distinctCompletedActivityCount ?? 0}개 · 최고 단계예요`
            : `완료 ${tree.distinctCompletedActivityCount ?? 0}개${tree.remainingCountForNextStage != null ? ` · ${tree.remainingCountForNextStage}개 더 하면 다음 단계` : ''}`}
        </AppText>
        {tree.plantedAt ? (
          <AppText variant="micro11Bold" color="textOnDarkMuted">
            {`심은 날 ${tree.plantedAt.slice(0, 10)}`}
          </AppText>
        ) : null}
      </LinearGradient>

      {cur ? (
        <Touchable
          accessibilityLabel="진행 중인 활동 이어하기"
          onPress={() => go(`/home/activity/${encodeURIComponent(key)}?userHobbyId=${tree.userHobbyId}&recordId=${cur.recordId}&activityId=${cur.activityId}`)}
          style={styles.current}
        >
          <IconSlot name="play" size={18} color="brandDeep" />
          <View style={styles.flex}>
            <AppText variant="caption12Bold" color="textMuted">
              진행 중인 활동
            </AppText>
            <AppText variant="callout14Bold" color="textPrimary">
              {`${cur.title ?? '활동'} · ${cur.progressPercent ?? 0}%`}
            </AppText>
          </View>
          <IconSlot name="chev" size={16} color="textMuted" />
        </Touchable>
      ) : null}

      <AppText variant="body16Bold" color="textPrimary">
        {`단계별 성장${per ? ` · 단계마다 활동 ${per}개` : ''}`}
      </AppText>
      <View style={styles.timeline}>
        {stages.map((s) => (
          <Touchable key={s.stageId} accessibilityLabel={`${s.stageNumber}단계 ${s.name}, ${STATE_TEXT[s.state]}`} onPress={() => openStage(s.stageId)} style={styles.node}>
            <View style={[styles.dot, s.state === 'COMPLETED' ? styles.dotDone : s.state === 'CURRENT' ? styles.dotCur : styles.dotLock]}>
              {s.state === 'COMPLETED' ? <IconSlot name="check" size={12} color="textOnDark" /> : null}
            </View>
            <View style={styles.flex}>
              <AppText variant="callout14Bold" color={s.state === 'LOCKED' ? 'textMuted' : 'textPrimary'}>
                {`${s.stageNumber}단계 · ${s.name}`}
              </AppText>
              <AppText variant="caption12Medium" color="textMuted">
                {`${STATE_TEXT[s.state]}${s.unlockAtDistinctCompletedCount ? ` · 활동 ${s.unlockAtDistinctCompletedCount}개 완료 시 열림` : ''}`}
              </AppText>
            </View>
            <IconSlot name="chev" size={16} color="textMuted" />
          </Touchable>
        ))}
        {stages.length === 0 ? (
          <AppText variant="callout14Regular" color="textMuted">
            단계 정보가 아직 없어요
          </AppText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 60 },
  content: { gap: 14 },
  summary: { gap: 6, padding: 18, borderRadius: 30 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  art: { alignItems: 'center', paddingVertical: 4 },
  current: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 20, backgroundColor: COLORS.bgKhaki },
  timeline: { gap: 8 },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  dot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: COLORS.brandPrimary },
  dotCur: { borderWidth: 3, borderColor: COLORS.brandPrimary, backgroundColor: COLORS.bgSurface },
  dotLock: { backgroundColor: COLORS.bgSunken },
});
