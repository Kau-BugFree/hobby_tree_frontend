/**
 * C-02 하비 코치 대화
 * - Top Bar(… → OV-01) + 기준 나무 칩 + ‘답변은 참고용이에요’
 * - 메시지 목록(FlatList): MeBubble / CoachAvatar + CoachBubble(출처·관련 활동 → E-02) / TypingBubble
 * - Composer: 가로 스크롤 빠른 질문 + 입력창(첨부 · 마이크/전송), KeyboardAvoidingView
 * - ?q= 로 들어오면(C-01 빠른 질문) 바로 보냄, ?focus=1 이면 입력창에 포커스
 * - 11/16 회의
 *   · 대화 기록 불러오기: 챗봇을 다시 열면 마지막 대화를 그대로 보여 주고 이어서 말한다 (목록 화면은 따로 없음)
 *   · 음성 입력: 입력칸이 비어 있으면 보내기 자리에 마이크 → 누르면 듣는 중(최대 60초) → 정지
 *     TODO(STT): 녹음 파일을 백엔드 STT로 보내 받은 글자를 입력칸에 넣는다 (이승준 데모 결과 보고 확정)
 */
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, HobbyIcon, IconSlot, KeyboardSafe, TopBar, Touchable, useToast } from '../../components';
import { CoachAvatar, CoachBubble, MeBubble, QuickPill, TypingBubble } from '../../components/chat/ChatParts';
import { ChatMessage, CONVERSATION_QUICK, DEFAULT_CONTEXT, INITIAL_MESSAGES } from '../../data/chat';
import { useAppState } from '../../lib/appState';
import { askCoach } from '../../lib/coach';
import { go } from '../../lib/nav';
import { COLORS, TYPO } from '../../theme';

const MAX_LEN = 500;
/** 음성 입력 한 번에 받을 수 있는 최대 길이(초) */
const VOICE_MAX_SEC = 60;
const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
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
  const { state, update } = useAppState();
  const ctx = DEFAULT_CONTEXT;
  // 지난 대화가 있으면 그대로 이어서 보여 준다 (처음 한 번만 읽음)
  const [restored] = useState(() => state.chatMessages);
  const [messages, setMessages] = useState<ChatMessage[]>(
    () =>
      restored ??
      // 빠른 질문으로 들어오면 답을 기다리는 데모 질문은 빼고 시작
      (q && PENDING ? INITIAL_MESSAGES.slice(0, -1) : INITIAL_MESSAGES),
  );
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [listenSec, setListenSec] = useState<number | null>(null);
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
  // (지난 대화를 이어 보는 경우에는 이미 답이 있으니 다시 묻지 않는다)
  useEffect(() => {
    // 마운트 때 한 번만 보내는 요청이라 effect 안에서 상태를 바꿔도 된다
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) send(q);
    else if (!restored && PENDING) request(INITIAL_MESSAGES[INITIAL_MESSAGES.length - 1].text);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 대화가 바뀔 때마다 저장 → 챗봇을 닫았다 다시 열어도 이어서 보인다
  useEffect(() => {
    update({ chatMessages: messages });
  }, [messages, update]);

  const listening = listenSec !== null;

  // 음성 입력: 1초마다 시간을 올린다
  useEffect(() => {
    if (!listening) return;
    const t = setInterval(() => setListenSec((s) => (s === null ? s : s + 1)), 1000);
    return () => clearInterval(t);
  }, [listening]);

  const stopListening = useCallback(
    (sec: number) => {
      setListenSec(null);
      if (sec < 1) {
        toast({ title: '너무 짧아요', sub: '버튼을 누르고 1초 이상 말해 주세요', icon: 'info' });
        return;
      }
      // TODO(STT): 녹음 파일 → 백엔드 STT → 받은 글자를 setDraft로 입력칸에 넣기
      toast({ title: '음성 인식은 준비 중이에요', sub: '연결되면 말한 내용이 입력칸에 들어가요', icon: 'info' });
    },
    [toast],
  );

  // 최대 길이에 닿으면 자동으로 멈춘다
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (listenSec !== null && listenSec >= VOICE_MAX_SEC) stopListening(listenSec);
  }, [listenSec, stopListening]);

  const canSend = !!draft.trim() && !typing;

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
        ListHeaderComponent={
          restored ? (
            <View style={styles.restored}>
              <View style={styles.restoredLine} />
              <AppText variant="micro11Bold" color="textMuted">
                지난 대화를 이어서 보여 드려요
              </AppText>
              <View style={styles.restoredLine} />
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
          {listenSec !== null ? (
            <View style={styles.listening} accessibilityLiveRegion="polite">
              <View style={styles.recDot} />
              <AppText variant="callout14Regular" color="textPrimary" style={styles.flex}>
                듣고 있어요…
              </AppText>
              <AppText variant="caption12Bold" color="textMuted">
                {`${mmss(listenSec)} / ${mmss(VOICE_MAX_SEC)}`}
              </AppText>
            </View>
          ) : (
            <TextInput
              value={draft}
              onChangeText={setDraft}
              autoFocus={focus === '1'}
              maxLength={MAX_LEN}
              multiline
              placeholder="메시지 입력 또는 마이크로 말하기"
              placeholderTextColor={COLORS.textMuted}
              accessibilityLabel="메시지 입력"
              style={[TYPO.callout14Regular, styles.input]}
            />
          )}
          {listenSec !== null ? (
            <Touchable small accessibilityLabel="음성 입력 멈추기" onPress={() => stopListening(listenSec)} style={[styles.send, styles.stop]}>
              <IconSlot name="stop" size={18} color="textOnDark" />
            </Touchable>
          ) : draft.trim() ? (
            <Touchable
              small
              accessibilityLabel="보내기"
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={() => send(draft)}
              style={[styles.send, !canSend && styles.sendOff]}
            >
              <IconSlot name="send" size={18} color="textOnDark" />
            </Touchable>
          ) : (
            <Touchable
              small
              accessibilityLabel="음성으로 말하기"
              accessibilityState={{ disabled: typing }}
              disabled={typing}
              onPress={() => setListenSec(0)}
              style={[styles.send, typing && styles.sendOff]}
            >
              <IconSlot name="mic" size={18} color="textOnDark" />
            </Touchable>
          )}
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
  stop: { backgroundColor: COLORS.accentDanger },
  listening: { flex: 1, minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  recDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: COLORS.accentDanger },
  restored: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4 },
  restoredLine: { flex: 1, height: 1, backgroundColor: COLORS.borderDefault },
});
