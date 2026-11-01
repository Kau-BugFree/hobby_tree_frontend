/**
 * C-02 하비 코치 대화
 * - Top Bar(… → OV-01) + 기준 나무 칩 + ‘답변은 참고용이에요’
 * - 메시지 목록(FlatList): MeBubble / CoachAvatar + CoachBubble(출처·관련 활동 → E-02) / TypingBubble
 * - Composer: 가로 스크롤 빠른 질문 + 입력창(첨부·전송), KeyboardAvoidingView
 * - ?q= 로 들어오면(C-01 빠른 질문) 바로 보냄, ?focus=1 이면 입력창에 포커스
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, HobbyIcon, IconSlot, KeyboardSafe, TopBar, Touchable, useToast } from '../../components';
import { CoachAvatar, CoachBubble, MeBubble, QuickPill, TypingBubble } from '../../components/chat/ChatParts';
import { ChatMessage, CONVERSATION_QUICK, DEFAULT_CONTEXT, INITIAL_MESSAGES } from '../../data/chat';
import { askCoach } from '../../lib/coach';
import { go } from '../../lib/nav';
import { COLORS, TYPO } from '../../theme';

const MAX_LEN = 500;
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
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    // 빠른 질문으로 들어오면 답을 기다리는 데모 질문은 빼고 시작
    q && PENDING ? INITIAL_MESSAGES.slice(0, -1) : INITIAL_MESSAGES,
  );
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const abortRef = useRef<AbortController | null>(null);

  const request = useCallback(
    async (text: string) => {
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
    [ctx, toast],
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

  // 첫 진입: ?q= 가 있으면 그 질문을, 없으면 Figma 마지막 상태(답을 기다리는 내 질문)에 대한 답을 요청
  useEffect(() => {
    // 마운트 때 한 번만 보내는 요청이라 effect 안에서 상태를 바꿔도 된다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) send(q);
    else if (PENDING) request(INITIAL_MESSAGES[INITIAL_MESSAGES.length - 1].text);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <KeyboardSafe style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar title="하비 코치" onAction={() => go('/overlay/more')} />
      <View style={styles.context}>
        <View style={styles.ctxChip}>
          <HobbyIcon hobby={ctx.hobby} size={14} />
          <AppText variant="caption12Bold" color="brandDeep">
            {`${ctx.hobby} · ${ctx.stageLabel} 기준`}
          </AppText>
        </View>
        <AppText variant="caption12Medium" color="textMuted">
          답변은 참고용이에요
        </AppText>
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
  messages: { gap: 12, paddingVertical: 10, paddingHorizontal: 20 },
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
