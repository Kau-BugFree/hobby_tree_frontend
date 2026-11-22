/**
 * H-04 활동 기록 (바텀 시트 오버레이)
 * - Figma 프레임은 홈 화면 복사본 위에 시트를 얹은 형태 → 배경 복사본은 버리고 transparentModal로 실제 이전 화면 위에 띄움
 * - 단일 선택 그룹 3개 → Segmented
 * 서버 기록(recordId)이면 API-29 활동 완료 및 피드백
 *   했어요 → COMPLETED · 조금 했어요 → PARTIAL (만족도·난이도 필수) · 못 했어요 → NOT_DONE (이유 필수)
 *   응답 growth.stageChanged면 성장 화면, 아니면 기록 완료 화면
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { ApiError } from '../../api/client';
import { completeActivityRecord } from '../../api/endpoints';
import type { CompleteRecordRequest } from '../../api/types';
import { useToast } from '../../components';
import { useForest } from '../../lib/forest';
import { StyleSheet, View } from 'react-native';

import { AppText, HobbyIcon, IconSlot, IconTile, OverlaySheet, Touchable } from '../../components';
import { Segmented } from '../../components/Segmented';
import { ACTIVITIES, treeByHobby } from '../../data/hobbies';
import { swap } from '../../lib/nav';
import { COLORS, shadow } from '../../theme';

const DID = ['했어요', '조금 했어요', '못 했어요'] as const;
const FUN = ['1', '2', '3', '4', '5'] as const;
const LEVEL = ['쉬웠어요', '적당해요', '어려웠어요'] as const;

const LEVEL_TO_SERVER = { 쉬웠어요: 'EASY', 적당해요: 'APPROPRIATE', 어려웠어요: 'HARD' } as const;

export default function RecordSheet() {
  const p = useLocalSearchParams<{ hobby?: string; recordId?: string; version?: string; title?: string; requiredLeft?: string }>();
  const recordId = Number(p.recordId) || 0;
  const mock = treeByHobby(p.hobby ?? '독서');
  const mockA = ACTIVITIES[mock.currentActivityId];
  const toast = useToast();
  const { reload } = useForest();
  const tree = mock;
  const a = recordId ? { ...mockA, title: p.title ?? '활동' } : mockA;
  const [did, setDid] = useState<(typeof DID)[number]>(Number(p.requiredLeft) > 0 ? '조금 했어요' : '했어요');
  const [fun, setFun] = useState<(typeof FUN)[number]>('4');
  const [level, setLevel] = useState<(typeof LEVEL)[number]>('적당해요');
  const [busy, setBusy] = useState(false);

  const onRecord = async () => {
    if (!recordId) return swap('/home/growth');
    const expectedVersion = Number(p.version) || 0;
    const feedback = { satisfactionScore: Number(fun), perceivedDifficulty: LEVEL_TO_SERVER[level] };
    const body: CompleteRecordRequest =
      did === '못 했어요'
        ? { status: 'NOT_DONE', expectedVersion, notDoneReason: '오늘은 하지 못했어요' }
        : { status: did === '했어요' ? 'COMPLETED' : 'PARTIAL', expectedVersion, feedback };
    setBusy(true);
    try {
      const res = await completeActivityRecord(recordId, body);
      reload();
      swap(res.growth?.stageChanged ? '/home/growth' : '/home/record-done');
    } catch (e) {
      const msg =
        e instanceof ApiError && e.code === 'RECORD400_3'
          ? '꼭 해야 하는 단계를 모두 체크해야 ‘했어요’로 기록할 수 있어요. ‘조금 했어요’로 기록해 보세요.'
          : e instanceof ApiError
            ? `${e.message} (${e.code})`
            : '기록하지 못했어요';
      toast({ title: '기록하지 못했어요', sub: msg, icon: 'info' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <OverlaySheet gap={16} style={styles.sheet}>
      <View style={styles.head}>
        <IconTile size={48} radius={16}>
          <HobbyIcon hobby={tree.hobby} size={22} color="brandPrimary" />
        </IconTile>
        <View style={styles.flex}>
          <AppText variant="title22Bold" color="brandDeep">
            활동 기록
          </AppText>
          <AppText variant="caption12Medium" color="textMuted">
            {recordId ? a.title : `${a.title} · ${tree.name} ${a.stage}단계`}
          </AppText>
        </View>
      </View>
      <View style={styles.q}>
        <AppText variant="callout14Bold" color="textBody">
          오늘 해 봤나요?
        </AppText>
        <Segmented options={DID} value={did} onChange={setDid} accessibilityLabel="오늘 해 봤나요?" />
      </View>
      <View style={styles.q}>
        <AppText variant="callout14Bold" color="textBody">
          얼마나 즐거웠나요?
        </AppText>
        <Segmented options={FUN} value={fun} onChange={setFun} variant="headline18Bold" accessibilityLabel="얼마나 즐거웠나요?" />
      </View>
      <View style={styles.q}>
        <AppText variant="callout14Bold" color="textBody">
          난이도는요?
        </AppText>
        <Segmented options={LEVEL} value={level} onChange={setLevel} accessibilityLabel="난이도" />
      </View>
      {recordId ? null : (
      <View style={styles.preview}>
        <IconSlot name="sprout" size={26} color="brandPrimary" />
        <View style={styles.flex}>
          <AppText variant="callout14Bold" color="brandDeep">
            {`이 기록으로 ${a.stage}단계 활동 3개 완료`}
          </AppText>
          <AppText variant="caption12Medium" color="textBody">
            {`${tree.name} 나무가 큰 나무로 자라요`}
          </AppText>
        </View>
      </View>
      )}
      <Touchable accessibilityLabel="기록하기" disabled={busy} onPress={onRecord} style={[styles.record, RECORD_SHADOW]}>
        <IconSlot name="pen" size={20} color="textOnDark" />
        <AppText variant="body16Bold" color="textOnDark">
          기록하기
        </AppText>
      </Touchable>
    </OverlaySheet>
  );
}

const RECORD_SHADOW = shadow(COLORS.shadowWater, 8, 20, 0.4, 8);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: { backgroundColor: COLORS.bgApp, borderTopLeftRadius: 34, borderTopRightRadius: 34 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  q: { gap: 8 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: COLORS.bgGreenSoft,
  },
  record: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 17,
    borderRadius: 999,
    backgroundColor: COLORS.brandPrimary,
  },
});
