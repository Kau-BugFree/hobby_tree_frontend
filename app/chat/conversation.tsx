/**
 * C-02 하비 코치 대화
 * - Top Bar(… → OV-01) + 기준 나무 칩 + ‘답변은 참고용이에요’
 * - 메시지 목록(FlatList): MeBubble / CoachAvatar + CoachBubble(출처·관련 활동 → E-02) / TypingBubble
 * - Composer: 가로 스크롤 빠른 질문 + 입력창(첨부·전송), KeyboardAvoidingView
 * - ?q= 로 들어오면(C-01 빠른 질문) 바로 보냄, ?focus=1 이면 입력창에 포커스
 * 로그인 상태: API-34 하비 코치
 *   - 처음 열면 가장 최근 대화(GET /coach/conversations)의 메시지(GET …/messages)를 이어서 보여 준다
 *   - 보내기 → POST /coach/chat (conversationId로 같은 대화를 이어감, Idempotency-Key로 중복 방지)
 *   - ‘새 대화’ → conversationId 없이 보내 새 대화 시작
 *   - 멀티턴: 첫 질문은 conversationId 없이 → 응답의 conversationId를 다음 질문에 그대로 담아 보낸다
 *     (앱을 다시 열면 마지막 대화 ID를 서버 목록에서 찾아 이어 간다)
 *   - 코치는 지금 요리만 지원 → 빠른 질문은 요리 시나리오(COOKING_SCENARIO) 순서
 * 체험 모드: 지금처럼 가짜 답변(lib/coach.ts)
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, HobbyIcon, IconSlot, KeyboardSafe, TopBar, Touchable, useToast } from '../../components';
import { CoachAvatar, CoachBubble, MeBubble, QuickPill, TypingBubble } from '../../components/chat/ChatParts';
import { ApiError, errorMessage, newIdempotencyKey } from '../../api/client';
import { getCoachMessages, listCoachConversations, sendCoachMessage } from '../../api/endpoints';
import type { CoachMessage, CoachSuggestedActivity } from '../../api/types';
import { ChatMessage, CONVERSATION_QUICK, DEFAULT_CONTEXT, INITIAL_MESSAGES } from '../../data/chat';
import { useAppState } from '../../lib/appState';
import { askCoach } from '../../lib/coach';
import { go } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { COLORS, TYPO } from '../../theme';

const MAX_LEN = 500;

/** 코치가 제안한 활동 → 말풍선 아래 ‘관련 활동’ (코치는 요리만 지원) */
const linkedOf = (s?: CoachSuggestedActivity[]): ChatMessage['linked'] =>
  s?.[0]?.title ? { title: s[0].title, hobby: '요리', reason: s[0].reason } : undefined;

/** 서버 메시지 → 화면 말풍선 */
const toBubble = (m: CoachMessage): ChatMessage => ({
  id: `s-${m.messageId}`,
  role: String(m.role).toUpperCase() === 'USER' ? 'me' : 'coach',
  text: m.content,
  source: m.references?.[0]?.title,
  linked: linkedOf(m.suggestedActivities),
});
const PENDING = INITIAL_MESSAGES[INITIAL_MESSAGES.length - 1].role === 'me';

function MessageRow({ item }: { item: ChatMessage }) {
  if (item.role === 'me') return <MeBubble text={item.text} />;
  return (
    <View style={styles.coachRow}>
      <CoachAvatar />
      <CoachBubble message={item} />
    </View>
  );
}

export default function ConversationScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { q, focus } = useLocalSearchParams<{ q?: string; focus?: string }>();
  const ctx = DEFAULT_CONTEXT;
  const { signedIn } = useSession();
  const { state, updateServer } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    signedIn
      ? []
      : // 빠른 질문으로 들어오면 답을 기다리는 데모 질문은 빼고 시작
        q && PENDING
        ? INITIAL_MESSAGES.slice(0, -1)
        : INITIAL_MESSAGES,
  );
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(signedIn);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationRef = useRef<number | null>(state.server.coachConversationId);

  /** 서버(API-34)로 질문 — 실패 후 같은 질문을 다시 보내면 같은 멱등 키를 쓴다 */
  const retryKey = useRef<{ text: string; key: string } | null>(null);
  const requestServer = useCallback(
    async (text: string) => {
      setTyping(true);
      const key = retryKey.current?.text === text ? retryKey.current.key : newIdempotencyKey();
      retryKey.current = { text, key };
      try {
        // 멀티턴: 직전 응답의 conversationId를 그대로 담는다 (첫 질문은 null → 서버가 새 대화를 만든다)
        const conversationId = conversationRef.current;
        let res;
        try {
          res = await sendCoachMessage({ conversationId, message: text }, key);
        } catch (e) {
          if (!(e instanceof ApiError) || e.status !== 409) throw e;
          if (__DEV__) console.log(`[코치] 409 (${e.code}) ${e.message}`);
          // 처리 중(COMMON409_2) → 잠깐 뒤 같은 키 / 그 밖의 409 → 새 키로 한 번 더
          await new Promise((r) => setTimeout(r, 1200));
          res = await sendCoachMessage({ conversationId, message: text }, e.code === 'COMMON409_2' ? key : newIdempotencyKey());
        }
        retryKey.current = null;
        if (__DEV__) console.log(`[코치] conversationId ${conversationId ?? '없음(새 대화)'} → ${res.conversationId}`);
        conversationRef.current = res.conversationId;
        updateServer({ coachConversationId: res.conversationId });
        setMessages((m) => [
          ...m,
          {
            id: `s-${res.messageId ?? Date.now()}`,
            role: 'coach',
            text: res.answer,
            source: res.references?.[0]?.title,
            linked: linkedOf(res.suggestedActivities),
          },
        ]);
      } catch (e) {
        toast({ title: '답변을 받지 못했어요', sub: `${errorMessage(e)}${e instanceof ApiError ? ` (${e.code})` : ''}` });
      } finally {
        setTyping(false);
      }
    },
    [toast, updateServer],
  );

  const request = useCallback(
    async (text: string) => {
      if (signedIn) return requestServer(text);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setTyping(true);
      try {
        const reply = await askCoach(text, ctx, ac.signal);
        setMessages((m) => [...m, reply]);
      } catch {
        if (!ac.signal.aborted) toast({ title: '답변을 받지 못했어요', sub: '잠시 후 다시 보내 주세요' });
      } finally {
        if (abortRef.current === ac) setTyping(false);
      }
    },
    [ctx, toast, signedIn, requestServer],
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;
      setMessages((m) => [...m, { id: `me-${Date.now()}`, role: 'me', text }]);
      setDraft('');
      request(text);
    },
    [request, typing],
  );

  // 첫 진입
  // - 체험 모드: ?q= 가 있으면 그 질문을, 없으면 Figma 마지막 상태(답을 기다리는 내 질문)에 대한 답을 요청
  // - 로그인 상태: 최근 대화를 불러온 뒤 ?q= 가 있으면 이어서 보냄
  useEffect(() => {
    if (!signedIn) {
      if (q) send(q);
      else if (PENDING) request(INITIAL_MESSAGES[INITIAL_MESSAGES.length - 1].text);
      return () => abortRef.current?.abort();
    }
    let alive = true;
    (async () => {
      try {
        let id = conversationRef.current;
        if (!id) id = (await listCoachConversations(null, 1)).items?.[0]?.conversationId ?? null;
        if (id && alive) {
          const page = await getCoachMessages(id);
          if (!alive) return;
          conversationRef.current = id;
          updateServer({ coachConversationId: id });
          setMessages((page.items ?? []).map(toBubble));
        }
      } catch {
        // 지난 대화를 못 불러와도 새 대화는 할 수 있다
      } finally {
        if (alive) {
          setLoadingHistory(false);
          if (q) send(q);
        }
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 새 대화: 다음 질문을 conversationId 없이 보낸다 */
  const newConversation = () => {
    conversationRef.current = null;
    updateServer({ coachConversationId: null });
    setMessages([]);
  };

  return (
    <KeyboardSafe style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar title="하비 코치" onAction={() => go('/overlay/more')} />
      <View style={styles.context}>
        {signedIn ? (
          <View style={styles.ctxChip}>
            <HobbyIcon hobby="요리" size={14} />
            <AppText variant="caption12Bold" color="brandDeep">
              요리 코치 · 대화는 저장돼요
            </AppText>
          </View>
        ) : (
          <View style={styles.ctxChip}>
            <HobbyIcon hobby={ctx.hobby} size={14} />
            <AppText variant="caption12Bold" color="brandDeep">
              {`${ctx.hobby} · ${ctx.stageLabel} 기준`}
            </AppText>
          </View>
        )}
        <AppText variant="caption12Medium" color="textMuted" style={styles.flex}>
          답변은 참고용이에요
        </AppText>
        {signedIn && messages.length > 0 ? (
          <Touchable small accessibilityLabel="새 대화 시작" disabled={typing} onPress={newConversation} style={styles.newChat}>
            <IconSlot name="plus" size={12} color="brandDeep" />
            <AppText variant="caption12Bold" color="brandDeep">
              새 대화
            </AppText>
          </Touchable>
        ) : null}
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MessageRow item={item} />}
        style={styles.flex}
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          signedIn ? (
            <View style={styles.empty}>
              {loadingHistory ? (
                <ActivityIndicator color={COLORS.brandPrimary} />
              ) : (
                <AppText variant="callout14Regular" color="textMuted" align="center">
                  {`${state.userName} 님, 요리 활동에 대해 물어보세요.\n아래 빠른 질문을 순서대로 눌러 봐도 좋아요.`}
                </AppText>
              )}
            </View>
          ) : undefined
        }
        ListFooterComponent={
          typing ? (
            <View style={styles.typingRow}>
              <CoachAvatar />
              <TypingBubble />
            </View>
          ) : undefined
        }
      />
      <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.quick}>
          {CONVERSATION_QUICK.map((p) => (
            <QuickPill key={p} label={p} onPress={() => send(p)} />
          ))}
        </ScrollView>
        <View style={styles.inputRow}>
          <Touchable
            small
            accessibilityLabel="사진 첨부"
            onPress={() => toast({ title: '사진 첨부는 준비 중이에요', icon: 'image' })}
            style={styles.attach}
          >
            <IconSlot name="plus" size={18} color="textBody" />
          </Touchable>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            autoFocus={focus === '1'}
            maxLength={MAX_LEN}
            multiline
            placeholder="메시지 입력"
            placeholderTextColor={COLORS.textMuted}
            accessibilityLabel="메시지 입력"
            style={[TYPO.callout14Regular, styles.input]}
          />
          <Touchable
            small
            accessibilityLabel="보내기"
            accessibilityState={{ disabled: !draft.trim() || typing }}
            disabled={!draft.trim() || typing}
            onPress={() => send(draft)}
            style={[styles.send, (!draft.trim() || typing) && styles.sendOff]}
          >
            <IconSlot name="send" size={18} color="textOnDark" />
          </Touchable>
        </View>
      </View>
    </KeyboardSafe>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  context: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingBottom: 6 },
  ctxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 999,
    backgroundColor: COLORS.bgGreenSoft,
  },
  messages: { gap: 12, paddingVertical: 10, paddingHorizontal: 20, flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  newChat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: COLORS.bgKhaki,
  },
  coachRow: { flexDirection: 'row', gap: 8 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  composer: { gap: 8, paddingTop: 8, paddingHorizontal: 16, backgroundColor: COLORS.bgApp },
  quick: { gap: 8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 6,
    borderRadius: 24,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  attach: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgSunken },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    paddingTop: 9,
    paddingBottom: 9,
    paddingHorizontal: 4,
    color: COLORS.textPrimary,
    includeFontPadding: false,
  },
  send: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgForest },
  sendOff: { opacity: 0.4 },
});
