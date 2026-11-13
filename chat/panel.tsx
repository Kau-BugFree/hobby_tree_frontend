/**
 * C-01 하비 코치 패널 (오버레이 — 지금 보던 탭 화면 위에 뜸)
 * - Figma 프레임의 홈 화면·탭바는 아래 화면 그대로 보이므로 다시 그리지 않음 (Dim + Coach panel + 닫기 FAB만)
 * - 빠른 질문·입력창·전체 대화 버튼 → C-02 (패널을 대화 화면으로 교체: 뒤로 가면 원래 탭)
 * - Dim / 닫기 FAB → BACK
 */
import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconSlot, TAB_BAR_HEIGHT, Touchable } from '../../components';
import { CoachAvatar, CoachBubble, QuickPill } from '../../components/chat/ChatParts';
import { DEFAULT_CONTEXT, PANEL_QUICK } from '../../data/chat';
import { useAppState } from '../../lib/appState';
import { back, swap } from '../../lib/nav';
import { COLORS, SHADOWS, shadow } from '../../theme';

const FAB = 56;

const openConversation = (q?: string) => swap(q ? `/chat/conversation?q=${encodeURIComponent(q)}` : '/chat/conversation?focus=1');

export default function CoachPanel() {
  const insets = useSafeAreaInsets();
  const { state } = useAppState();
  const ctx = DEFAULT_CONTEXT;
  const fabBottom = Math.max(insets.bottom, 12) + TAB_BAR_HEIGHT + 12;

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={back} style={[StyleSheet.absoluteFill, styles.dim]} />
      <View style={[styles.panel, PANEL_SHADOW, { marginBottom: fabBottom + FAB + 12 }]}>
        {Platform.OS === 'ios' ? <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} /> : null}
        <View style={styles.head}>
          <CoachAvatar size={38} />
          <View style={styles.flex}>
            <AppText variant="body16Bold" color="textPrimary">
              하비 코치
            </AppText>
            <AppText variant="caption12Medium" color="textMuted">
              {`${ctx.hobby} 나무 ${ctx.stage}단계 기준으로 답해요`}
            </AppText>
          </View>
          <Touchable small accessibilityLabel="전체 대화 열기" onPress={() => openConversation()} style={styles.expand}>
            <IconSlot name="expand" size={16} color="textBody" />
          </Touchable>
        </View>
        <CoachBubble
          tone="green"
          message={{
            text: `${state.userName} 님, 오늘은 ‘${ctx.activityTitle}’를 이어서 해 볼까요? 막히는 게 있으면 편하게 물어보세요.`,
          }}
        />
        <AppText variant="caption12Bold" color="textMuted">
          빠른 질문
        </AppText>
        <View style={styles.quick}>
          {PANEL_QUICK.map((q, i) => (
            <QuickPill key={q} label={q} highlighted={i === 0} onPress={() => openConversation(q)} />
          ))}
        </View>
        <Touchable accessibilityLabel="하비 코치에게 물어보기" onPress={() => openConversation()} style={styles.input}>
          <AppText variant="callout14Regular" color="textMuted" style={styles.flex}>
            하비 코치에게 물어보기
          </AppText>
          <View style={styles.send}>
            <IconSlot name="send" size={18} color="textOnDark" />
          </View>
        </Touchable>
      </View>
      <Touchable accessibilityLabel="하비 코치 닫기" onPress={back} style={[styles.fab, { bottom: fabBottom }]}>
        <IconSlot name="close" size={22} color="paletteKhaki" />
      </Touchable>
    </View>
  );
}

const PANEL_SHADOW = shadow(COLORS.shadowForest, 16, 40, 0.3, 12);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16 },
  dim: { backgroundColor: COLORS.dim },
  panel: {
    gap: 12,
    padding: 18,
    borderRadius: 30,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    overflow: Platform.OS === 'ios' ? 'hidden' : 'visible',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  expand: { width: 34, height: 34, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgSunken },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingRight: 6,
    paddingLeft: 16,
    borderRadius: 999,
    backgroundColor: COLORS.bgSunken,
  },
  send: { width: 38, height: 38, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgForest },
  fab: {
    position: 'absolute',
    right: 20,
    width: FAB,
    height: FAB,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgForest,
    ...SHADOWS.fab,
  },
});
