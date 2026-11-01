/** T-05 예약 완료 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, KeyValue, Screen, TreeStage } from '../../components';
import { classById } from '../../data/together';
import { withComma } from '../../lib/appState';
import { reset } from '../../lib/nav';
import { COLORS } from '../../theme';

export default function BookedScreen() {
  const p = useLocalSearchParams<{ id?: string; date?: string; time?: string; people?: string; pay?: string }>();
  const c = classById(p.id);
  const people = Number(p.people ?? 1);
  const when = `${p.date ?? '10/18(토)'} ${p.time ?? '14:00 – 16:00'}`;
  // TODO(API): 예약번호는 서버 응답 값으로 표시
  const rows = [
    { k: '클래스', v: c.title },
    { k: '일시', v: when },
    { k: '장소', v: `${c.area.split(' · ')[0]} · ${c.host}` },
    { k: '인원', v: `${people}명` },
    { k: '결제', v: `${withComma(c.price * people)}원 · ${p.pay ?? '신용·체크카드'}` },
    { k: '예약번호', v: 'HT-1018-0427' },
  ];
  return (
    <Screen
      footer={
        <>
          <Button label="함께로 돌아가기" onPress={() => reset('/together')} />
          <Button label="홈으로" variant="ghost" onPress={() => reset('/home')} />
        </>
      }
      contentStyle={styles.content}
    >
      <View style={styles.done}>
        <IconSlot name="check" size={38} color="textOnDark" />
      </View>
      <AppText variant="title26Black" color="textPrimary" align="center">
        예약이 완료됐어요
      </AppText>
      <AppText variant="callout14Regular" color="textBody" align="center">
        {`${when.split(' – ')[0]}, ${c.host}에서 만나요.\n클래스 전날 알림으로 한 번 더 알려드릴게요.`}
      </AppText>
      <View style={styles.receipt}>
        {rows.map((r) => (
          <KeyValue key={r.k} k={r.k} v={r.v} keyWidth={64} />
        ))}
      </View>
      <View style={styles.treeLink}>
        <View style={styles.treeTile}>
          <TreeStage stage={c.stage} scale={0.15} />
        </View>
        <View style={styles.flex}>
          <AppText variant="callout14Bold" color="brandDeep">
            {`내 ${c.hobby} 나무와 연결돼요`}
          </AppText>
          <AppText variant="caption12Medium" color="textBody">
            {`참여 후 기록하면 ${c.hobby} ${c.stage}단계 활동 1개로 기록돼요`}
          </AppText>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { alignItems: 'center', gap: 14, paddingTop: 40 },
  done: { width: 76, height: 76, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brandPrimary },
  receipt: {
    alignSelf: 'stretch',
    gap: 10,
    padding: 18,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  treeLink: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 20,
    backgroundColor: COLORS.bgGreenSoft,
  },
  treeTile: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    overflow: 'hidden',
  },
});
