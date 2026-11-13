/**
 * H-08 알림
 * - 반복 "Notice/…" 행 → NoticeRow + MOCK_DATA(NOTICES)
 * - 알림 빈도 단일 선택 (기본: 받지 않기)
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, ChipGroup, IconSlot, IconTile, Screen, TopBar, Touchable } from '../../components';
import { NOTICE_FREQUENCY, NOTICES, NoticeItem } from '../../data/hobbies';
import { useAppState } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

function NoticeRow({ item }: { item: NoticeItem }) {
  return (
    <Touchable accessibilityLabel={item.title} onPress={item.href ? () => go(item.href!) : undefined} style={styles.notice}>
      <IconTile size={40} radius={14}>
        <IconSlot name={item.icon} size={20} color="brandDeep" />
      </IconTile>
      <View style={styles.flex}>
        <AppText variant="callout14Bold" color="textPrimary">
          {item.title}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {item.sub}
        </AppText>
      </View>
      <IconSlot name="chev" size={16} color="textMuted" />
    </Touchable>
  );
}

export default function NotificationsScreen() {
  const { state, setAnswer } = useAppState();
  const freq = (state.answers.noticeFrequency as (typeof NOTICE_FREQUENCY)[number]) ?? '받지 않기';
  return (
    <Screen header={<TopBar title="알림" />} contentStyle={styles.content}>
      <AppText variant="caption12Bold" color="textMuted">
        오늘
      </AppText>
      {NOTICES.map((n) => (
        <NoticeRow key={n.id} item={n} />
      ))}
      <AppText variant="caption12Bold" color="textMuted" style={styles.section}>
        알림 설정
      </AppText>
      <Card>
        <AppText variant="callout14Bold" color="textPrimary">
          알림은 기본으로 꺼져 있어요
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          원하는 빈도를 고를 때만 알려 드려요. 연속 기록이 끊겨도 알리지 않아요.
        </AppText>
        {/* TODO(API): 빈도를 고르면 푸시 권한 요청 → PUT /me/notification-settings */}
        <ChipGroup options={NOTICE_FREQUENCY} value={freq} onChange={(v) => setAnswer('noticeFrequency', v)} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 10 },
  section: { marginTop: 8 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
});
