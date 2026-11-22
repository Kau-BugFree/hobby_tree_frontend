/**
 * H-08 알림
 * - 반복 "Notice/…" 행 → NoticeRow
 * - 알림 빈도 단일 선택 (기본: 받지 않기)
 * 로그인 상태:
 *   - API-44 알림 목록(최신순 · 안 읽은 수) · 누르면 API-45 읽음 처리 후 대상 화면으로
 *   - 알림 빈도 → API-46 (받지 않기 NONE · 주 1회 요약 WEEKLY · 활동한 날만 ACTIVITY_DAYS)
 * 체험 모드: MOCK_DATA(NOTICES)
 */
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { getMe, listNotifications, markNotificationRead, updateNotificationSettings } from '../../api/endpoints';
import { hobbyKeyOf } from '../../api/mappers';
import type { AppNotification, NotificationFrequency } from '../../api/types';
import { AppText, Button, Card, ChipGroup, IconSlot, IconTile, Screen, TopBar, Touchable, useToast } from '../../components';
import { NOTICE_FREQUENCY, NOTICES, NoticeItem } from '../../data/hobbies';
import { useAppState } from '../../lib/appState';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { COLORS } from '../../theme';

type FreqLabel = (typeof NOTICE_FREQUENCY)[number];
const FREQ_TO_SERVER: Record<FreqLabel, NotificationFrequency> = { '받지 않기': 'NONE', '주 1회 요약': 'WEEKLY', '활동한 날만': 'ACTIVITY_DAYS' };
const FREQ_FROM_SERVER: Record<NotificationFrequency, FreqLabel> = { NONE: '받지 않기', WEEKLY: '주 1회 요약', ACTIVITY_DAYS: '활동한 날만' };

const ICON_OF: Record<string, string> = {
  ACTIVITY_REMINDER: 'clock',
  TREE_GROWTH: 'sprout',
  EXPERIENCE_OPEN: 'calendar',
  ANNOUNCEMENT: 'info',
  CHAT_LAUNCH: 'chat',
};

function NoticeRow({ item, unread, onPress }: { item: NoticeItem; unread?: boolean; onPress?: () => void }) {
  return (
    <Touchable accessibilityLabel={`${unread ? '안 읽음, ' : ''}${item.title}`} onPress={onPress ?? (item.href ? () => go(item.href!) : undefined)} style={[styles.notice, unread && styles.unread]}>
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
      {unread ? <View style={styles.dot} /> : null}
      <IconSlot name="chev" size={16} color="textMuted" />
    </Touchable>
  );
}

export default function NotificationsScreen() {
  const { state, setAnswer } = useAppState();
  const { signedIn } = useSession();
  const { trees } = useForest();
  const toast = useToast();
  const freq = (state.answers.noticeFrequency as FreqLabel) ?? '받지 않기';
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [unreadCount, setUnread] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (after: string | null = null) => {
      try {
        const res = await listNotifications({ cursor: after, size: 20 });
        setItems((prev) => (after && prev ? [...prev, ...(res.items ?? [])] : (res.items ?? [])));
        setUnread(res.unreadCount ?? 0);
        setCursor(res.nextCursor ?? null);
        setHasNext(!!res.hasNext);
        setError(null);
      } catch (e) {
        setError(errorMessage(e));
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      if (!signedIn) return;
      load();
      // 서버 알림 설정을 화면 칩에 맞춘다 (API-05)
      getMe()
        .then((me) => {
          const f = me.notificationSettings?.notificationFrequency;
          if (f && FREQ_FROM_SERVER[f]) setAnswer('noticeFrequency', FREQ_FROM_SERVER[f]);
        })
        .catch(() => undefined);
    }, [signedIn, load, setAnswer]),
  );

  /** 알림 대상 → 앱 화면 */
  const targetHref = (n: AppNotification): string | null => {
    const id = n.target?.id;
    switch (n.target?.type) {
      case 'USER_HOBBY': {
        const t = trees.find((x) => x.server?.userHobbyId === id);
        return id ? `/my/roadmap?hobby=${encodeURIComponent(t?.hobby ?? hobbyKeyOf(t?.name))}&userHobbyId=${id}` : '/home';
      }
      case 'EXPERIENCE':
        return id ? `/together/class/${id}` : '/together';
      case 'ACTIVITY':
        return id ? `/experience/detail?activityId=${id}` : null;
      default:
        return null;
    }
  };

  const open = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        const r = await markNotificationRead(n.notificationId);
        setItems((list) => list?.map((x) => (x.notificationId === n.notificationId ? { ...x, isRead: true, readAt: r.readAt } : x)) ?? list);
        if (r.unreadCount != null) setUnread(r.unreadCount);
      } catch {
        // 읽음 처리 실패해도 이동은 한다
      }
    }
    const href = targetHref(n);
    if (href) go(href);
  };

  const onFreq = async (v: FreqLabel) => {
    const prev = freq;
    setAnswer('noticeFrequency', v);
    if (!signedIn) return;
    try {
      await updateNotificationSettings(FREQ_TO_SERVER[v]);
    } catch (e) {
      setAnswer('noticeFrequency', prev);
      toast({ title: '알림 설정을 바꾸지 못했어요', sub: errorMessage(e), icon: 'info' });
    }
  };

  return (
    <Screen header={<TopBar title="알림" />} contentStyle={styles.content}>
      {signedIn ? (
        <>
          <AppText variant="caption12Bold" color="textMuted">
            {unreadCount ? `안 읽은 알림 ${unreadCount}개` : '알림'}
          </AppText>
          {items === null && !error ? <ActivityIndicator color={COLORS.brandPrimary} /> : null}
          {error ? (
            <AppText variant="callout14Regular" color="textBody">
              {error}
            </AppText>
          ) : null}
          {items?.length === 0 ? (
            <AppText variant="callout14Regular" color="textMuted">
              아직 받은 알림이 없어요
            </AppText>
          ) : null}
          {(items ?? []).map((n) => (
            <NoticeRow
              key={n.notificationId}
              unread={!n.isRead}
              item={{ id: String(n.notificationId), title: n.title, sub: n.body ?? (n.createdAt ?? '').slice(0, 10), icon: ICON_OF[n.type] ?? 'bell' }}
              onPress={() => open(n)}
            />
          ))}
          {hasNext ? <Button label="더 보기" variant="outline" onPress={() => load(cursor)} /> : null}
        </>
      ) : (
        <>
          <AppText variant="caption12Bold" color="textMuted">
            오늘
          </AppText>
          {NOTICES.map((n) => (
            <NoticeRow key={n.id} item={n} />
          ))}
        </>
      )}
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
        <ChipGroup options={NOTICE_FREQUENCY} value={freq} onChange={onFreq} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 10 },
  section: { marginTop: 8 },
  unread: { borderColor: COLORS.brandPrimary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.brandPrimary },
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
