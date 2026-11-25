/**
 * 하비 코치 · 지난 대화 (49개 목록 밖 신규 API)
 * - GET /coach/conversations : 최근 대화가 먼저, 마지막 메시지 80자 미리보기, 커서 페이지
 * - 누르면 그 대화로 (GET /coach/conversations/{id}/messages)
 */
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { listCoachConversations } from '../../api/endpoints';
import type { CoachConversation } from '../../api/types';
import { AppText, Button, IconSlot, Screen, TopBar, Touchable } from '../../components';
import { useForest } from '../../lib/forest';
import { go } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { COLORS } from '../../theme';

const when = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const same = d.toDateString() === today.toDateString();
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return same ? `오늘 ${hm}` : `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

export default function CoachHistoryScreen() {
  const { signedIn } = useSession();
  const { trees } = useForest();
  const [items, setItems] = useState<CoachConversation[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (after: string | null) => {
    try {
      const page = await listCoachConversations(after, 20);
      setItems((prev) => (after && prev ? [...prev, ...(page.items ?? [])] : (page.items ?? [])));
      setCursor(page.nextCursor ?? null);
      setHasNext(!!page.hasNext && !!page.nextCursor);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
      setItems((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (signedIn) load(null);
    }, [signedIn, load]),
  );

  const treeName = (c: CoachConversation) => trees.find((t) => t.server?.userHobbyId === c.userHobbyId)?.name;

  return (
    <Screen header={<TopBar title="지난 대화" />} contentStyle={styles.content}>
      <Button label="새 대화 시작하기" variant="outline" onPress={() => go('/chat/conversation?new=1')} />
      {!signedIn ? (
        <AppText variant="callout14Regular" color="textMuted" align="center" style={styles.empty}>
          로그인하면 하비 코치와 나눈 대화가 저장돼요
        </AppText>
      ) : items === null ? (
        <ActivityIndicator color={COLORS.brandPrimary} />
      ) : null}
      {error ? (
        <AppText variant="callout14Regular" color="textBody">
          {error}
        </AppText>
      ) : null}
      {signedIn && items && items.length === 0 && !error ? (
        <AppText variant="callout14Regular" color="textMuted" align="center" style={styles.empty}>
          아직 나눈 대화가 없어요
        </AppText>
      ) : null}
      {(items ?? []).map((c) => (
        <Touchable key={c.conversationId} accessibilityLabel="이 대화 열기" onPress={() => go(`/chat/conversation?cid=${c.conversationId}`)} style={styles.row}>
          <View style={styles.icon}>
            <IconSlot name="chat" size={18} color="brandDeep" />
          </View>
          <View style={styles.flex}>
            <View style={styles.head}>
              <AppText variant="caption12Bold" color="brandPrimary">
                {treeName(c) ? `${treeName(c)} 코치` : '하비 코치'}
              </AppText>
              <AppText variant="caption12Medium" color="textMuted">
                {when(c.lastMessageAt ?? c.createdAt)}
              </AppText>
            </View>
            <AppText variant="callout14Regular" color="textPrimary" numberOfLines={2}>
              {c.lastMessagePreview ?? '(메시지 없음)'}
            </AppText>
          </View>
        </Touchable>
      ))}
      {hasNext ? <Button label="더 보기" variant="outline" onPress={() => load(cursor)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  content: { gap: 10 },
  empty: { paddingVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 16, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgGreenSoft },
  head: { flexDirection: 'row', justifyContent: 'space-between' },
});
