/**
 * H-08 알림
 * - 반복 "Notice/…" 행 → NoticeRow
 * - 알림 켜고 끄기는 MY ‘알림 받기’ 스위치 (Figma v5)
 * 로그인 상태:
 *   - API-44 알림 목록(최신순 · 안 읽은 수) · 누르면 API-45 읽음 처리 후 대상 화면으로
 * 체험 모드: MOCK_DATA(NOTICES)
 */
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { listNotifications, markNotificationRead } from '../../api/endpoints';
import { hobbyKeyOf } from '../../api/mappers';
import type { AppNotification } from '../../api/types';
import { AppText, Button, Card, IconSlot, IconTile, Screen, TopBar, Touchable } from '../../components';
import { NOTICES, NoticeItem } from '../../data/hobbies';
import { useForest } from '../../lib/forest';
import { go, reset } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { COLORS } from '../../theme';


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
  const { signedIn } = useSession();
  const { trees } = useForest();
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
    }, [signedIn, load]),
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
          알림 켜고 끄는 건 MY에서 해요
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          MY의 ‘알림 받기’ 스위치로 언제든 바꿀 수 있어요. 기본은 꺼져 있어요.
        </AppText>
        <Touchable accessibilityLabel="MY에서 알림 설정하기" onPress={() => reset('/my')}>
          <AppText variant="caption12Bold" color="brandPrimary">
            MY에서 설정하기 ›
          </AppText>
        </Touchable>
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
