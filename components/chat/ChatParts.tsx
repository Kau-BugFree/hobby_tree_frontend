/**
 * 하비 코치 공통 서브 컴포넌트 (C-01 패널 · C-02 대화)
 * - CoachAvatar, MeBubble, CoachBubble(출처 + 관련 활동), TypingBubble, QuickPill
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import type { ChatMessage } from '../../data/chat';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { IconSlot } from '../IconSlot';
import { Touchable } from '../Touchable';

export function CoachAvatar({ size = 30 }: { size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size }]}>
      <IconSlot name="coach" size={size * 0.47} color="paletteKhaki" />
    </View>
  );
}

export function MeBubble({ text }: { text: string }) {
  return (
    <View style={styles.me}>
      <AppText variant="callout14Regular" color="textOnDark">
        {text}
      </AppText>
    </View>
  );
}

export function CoachBubble({ message, tone = 'surface' }: { message: Pick<ChatMessage, 'text' | 'source' | 'linked'>; tone?: 'surface' | 'green' }) {
  const { linked } = message;
  return (
    <View style={styles.coachCol}>
      <View style={[styles.coach, tone === 'green' ? styles.coachGreen : styles.coachSurface]}>
        <AppText variant="callout14Regular" color="textPrimary">
          {message.text}
        </AppText>
        {message.source ? (
          <View style={styles.source}>
            <IconSlot name="book" size={13} color="brandPrimary" />
            <AppText variant="micro11Bold" color="brandPrimary">
              {`출처 · ${message.source}`}
            </AppText>
          </View>
        ) : null}
      </View>
      {linked ? (
        <View style={styles.linked}>
          <IconSlot name="leaf" size={16} color="brandDeep" />
          <View style={styles.flex}>
            <AppText variant="caption12Bold" color="textPrimary">
              {linked.stage ? `관련 활동 · ${linked.title} (${linked.stage}단계)` : `관련 활동 · ${linked.title}`}
            </AppText>
            {linked.reason ? (
              <AppText variant="micro11Bold" color="textMuted">
                {linked.reason}
              </AppText>
            ) : null}
          </View>
          {linked.stage ? (
            <Touchable
              accessibilityLabel={`${linked.title} 활동 보기`}
              onPress={() => go(`/experience/stage?hobby=${encodeURIComponent(linked.hobby)}&stage=${linked.stage}`)}
              style={styles.linkedBtn}
            >
              <AppText variant="caption12Bold" color="textOnDark">
                활동 보기
              </AppText>
            </Touchable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Figma "Typing" (점 3개). 점이 차례로 깜빡인다. */
export function TypingBubble() {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.stagger(
        160,
        dots.map((d) =>
          Animated.sequence([
            Animated.timing(d, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(d, { toValue: 0.3, duration: 280, useNativeDriver: true }),
          ]),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [dots]);
  return (
    <View style={styles.typing} accessibilityLabel="하비 코치가 답을 쓰고 있어요">
      {dots.map((d, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
      ))}
    </View>
  );
}

export function QuickPill({ label, highlighted, onPress }: { label: string; highlighted?: boolean; onPress: () => void }) {
  return (
    <Touchable small accessibilityLabel={`빠른 질문: ${label}`} onPress={onPress} style={[styles.pill, highlighted ? styles.pillOn : styles.pillOff]}>
      <AppText variant="caption12Bold" color={highlighted ? 'brandDeep' : 'textBody'}>
        {label}
      </AppText>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  avatar: { borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgForest },
  me: {
    alignSelf: 'flex-end',
    maxWidth: '82%',
    paddingVertical: 11,
    paddingHorizontal: 14,
    backgroundColor: COLORS.bgForest,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 20,
  },
  // flex: 1(기준 0)이면 세로로 쌓이는 패널 안에서 높이가 0으로 눌려 글이 안 보인다 → 내용 높이 기준으로 늘고 줄게
  coachCol: { flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 8 },
  coach: {
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },
  coachSurface: { backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  coachGreen: { backgroundColor: COLORS.bgGreenSoft },
  source: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2, paddingLeft: 2 },
  linked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 18,
    backgroundColor: COLORS.bgKhaki,
  },
  linkedBtn: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, backgroundColor: COLORS.bgForest },
  typing: {
    width: 61,
    height: 33,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    borderBottomLeftRadius: 18,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.textMuted },
  pill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, minHeight: 32, justifyContent: 'center' },
  pillOn: { backgroundColor: COLORS.bgGreenSoft },
  pillOff: { backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
});
