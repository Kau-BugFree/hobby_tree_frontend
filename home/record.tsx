/**
 * H-04 활동 기록 (바텀 시트 오버레이)
 * - Figma 프레임은 홈 화면 복사본 위에 시트를 얹은 형태 → 배경 복사본은 버리고 transparentModal로 실제 이전 화면 위에 띄움
 * - 단일 선택 그룹 3개 → Segmented
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, HobbyIcon, IconSlot, IconTile, OverlaySheet, Touchable } from '../../components';
import { Segmented } from '../../components/Segmented';
import { ACTIVITIES, treeByHobby } from '../../data/hobbies';
import { swap } from '../../lib/nav';
import { COLORS, shadow } from '../../theme';

const DID = ['했어요', '조금 했어요', '못 했어요'] as const;
const FUN = ['1', '2', '3', '4', '5'] as const;
const LEVEL = ['쉬웠어요', '적당해요', '어려웠어요'] as const;

export default function RecordSheet() {
  const { hobby } = useLocalSearchParams<{ hobby?: string }>();
  const tree = treeByHobby(hobby ?? '독서');
  const a = ACTIVITIES[tree.currentActivityId];
  const [did, setDid] = useState<(typeof DID)[number]>('했어요');
  const [fun, setFun] = useState<(typeof FUN)[number]>('4');
  const [level, setLevel] = useState<(typeof LEVEL)[number]>('적당해요');

  // TODO(API): POST /records { activityId, did, fun, level } → 응답의 성장 여부로 다음 화면 결정
  const onRecord = () => swap('/home/growth');

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
            {`${a.title} · ${tree.name} ${a.stage}단계`}
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
      <Touchable accessibilityLabel="기록하기" onPress={onRecord} style={[styles.record, RECORD_SHADOW]}>
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
