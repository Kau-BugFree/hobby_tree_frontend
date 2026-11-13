/**
 * T-02 클래스 상세 / T-06 요리 클래스 상세 · 준비 중 (같은 레이아웃, 데이터만 다름)
 * - 서브 컴포넌트: InfoRows(일시·장소·정원·준비물), TreeLinkCard
 * - 하단 고정: 채팅(준비 중 → T-03) + ‘가격 · 예약하기’
 *   예약 가능 → T-04, 준비 중 → T-07(아직 준비중이에요)
 */
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, IllustrationSlot, InfoNote, KeyValue, Screen, Tag, TopBar, Touchable, TreeStage } from '../../../components';
import { classById } from '../../../data/together';
import { withComma } from '../../../lib/appState';
import { go } from '../../../lib/nav';
import { COLORS, shadow } from '../../../theme';

export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = classById(id);
  const rows = [
    { k: '일시', v: c.when, icon: 'calendar' },
    { k: '장소', v: c.area, icon: 'pin' },
    { k: '정원', v: c.capacity, icon: 'users' },
    { k: '준비물', v: c.prep, icon: 'bag' },
  ];
  const onBook = () => (c.bookable ? go(`/together/book?id=${c.id}`) : go(`/together/coming-soon?id=${c.id}`));

  return (
    <Screen
      header={<TopBar title="클래스 상세" onAction={() => go(`/overlay/more?title=${encodeURIComponent(c.title)}&path=${encodeURIComponent(`/class/${c.id}`)}`)} />}
      footer={
        <View style={styles.footerRow}>
          <Touchable accessibilityLabel="채팅, 준비 중" onPress={() => go('/together/chat-soon')} style={styles.chat}>
            <IconSlot name="chat" size={22} color="brandDeep" />
          </Touchable>
          <Button label={`${withComma(c.price)}원 · 예약하기`} onPress={onBook} style={styles.flex} />
        </View>
      }
    >
      <View style={styles.image}>
        <IllustrationSlot name={`class-${c.id}`} width={200} height={120} />
        <View style={styles.imageTags}>
          <Tag label="원데이 클래스" tone="solid" />
          {c.bookable ? <Tag label="제휴" tone="ad" /> : <Tag label="준비 중" tone="gray" />}
        </View>
      </View>
      <View style={styles.titles}>
        <AppText variant="caption12Bold" color="textMuted">
          {c.hostMeta}
        </AppText>
        <AppText variant="title22Bold" color="textPrimary">
          {c.title}
        </AppText>
      </View>
      <View style={styles.info}>
        {rows.map((r) => (
          <KeyValue key={r.k} k={r.k} v={r.v} icon={r.icon} keyWidth={48} />
        ))}
      </View>
      <LinearGradient colors={[COLORS.bgForest2, COLORS.bgForest]} style={[styles.treeLink, TREE_SHADOW]}>
        <TreeStage stage={c.stage} scale={66 / 300} />
        <View style={styles.flex}>
          <AppText variant="body16Bold" color="textOnDark">
            {`내 ${c.hobby} 나무와 연결돼요`}
          </AppText>
          <AppText variant="caption12Medium" color="textOnDarkMuted">
            {`참여하면 ${c.hobby} ${c.stage}단계 활동 1개로 기록돼요`}
          </AppText>
        </View>
      </LinearGradient>
      <InfoNote
        bold
        text={c.bookable ? '제휴 클래스예요. 취소·환불은 판매처 규정을 따라요.' : '예약 오픈 전이에요. 알림을 받으면 예약이 열릴 때 알려드려요.'}
      />
    </Screen>
  );
}

const TREE_SHADOW = shadow(COLORS.shadowForest, 8, 18, 0.2, 6);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footerRow: { alignSelf: 'stretch', flexDirection: 'row', gap: 10 },
  chat: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  image: { height: 150, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgKhaki },
  imageTags: { position: 'absolute', top: 14, left: 16, flexDirection: 'row', gap: 6 },
  titles: { gap: 2 },
  info: {
    gap: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  treeLink: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 24 },
});
