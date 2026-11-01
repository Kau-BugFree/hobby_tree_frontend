import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { go } from '../../lib/nav';
import { COLORS } from '../../theme';
import { AppText } from '../AppText';
import { IconSlot } from '../IconSlot';
import { Touchable } from '../Touchable';

export interface StepItem {
  title: string;
  sub?: string;
}

/** Figma "Toggle · H-07 · 할 일 n" — 누르면 완료/미완료 전환 */
function StepToggleRow({ step, done, last, onToggle }: { step: StepItem; done: boolean; last: boolean; onToggle: () => void }) {
  return (
    <Touchable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={step.title}
      onPress={onToggle}
      style={[styles.step, !last && styles.stepDivider]}
    >
      <View style={[styles.stepCheck, done ? styles.stepCheckOn : styles.stepCheckOff]}>
        {done ? <IconSlot name="check" size={14} color="textOnDark" /> : null}
      </View>
      <View style={styles.flex}>
        <AppText variant="callout14Bold" color={done ? 'textPrimary' : 'textPrimary'}>
          {step.title}
        </AppText>
        {step.sub ? (
          <AppText variant="caption12Medium" color="textMuted">
            {step.sub}
          </AppText>
        ) : null}
      </View>
    </Touchable>
  );
}

const parseTimer = (t: string) => {
  const [m, s] = t.split(':').map(Number);
  return m * 60 + s;
};
const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/** Figma "Timer" 카드 + 일시정지/재생 토글 */
export function TimerCard({ initial, label }: { initial: string; label: string }) {
  const [sec, setSec] = useState(parseTimer(initial));
  const [running, setRunning] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!running) return undefined;
    timer.current = setInterval(() => setSec((s) => s + 1), 1000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [running]);
  return (
    <View style={styles.timer}>
      <IconSlot name="hourglass" size={22} color="paletteKhaki" />
      <View style={styles.flex}>
        <AppText variant="title22Bold" color="textOnDark">
          {fmt(sec)}
        </AppText>
        <AppText variant="caption12Medium" color="textOnDarkMuted">
          {running ? label : '잠시 멈췄어요'}
        </AppText>
      </View>
      <Touchable
        accessibilityLabel={running ? '일시정지' : '다시 시작'}
        onPress={() => setRunning((r) => !r)}
        style={styles.pause}
      >
        <IconSlot name={running ? 'pause' : 'play'} size={18} color="textOnDark" />
      </Touchable>
    </View>
  );
}

/** 할 일 목록 카드 */
export function StepList({ steps, done, onToggle }: { steps: StepItem[]; done: boolean[]; onToggle: (i: number) => void }) {
  return (
    <View style={styles.steps}>
      {steps.map((s, i) => (
        <StepToggleRow key={s.title} step={s} done={!!done[i]} last={i === steps.length - 1} onToggle={() => onToggle(i)} />
      ))}
    </View>
  );
}

/** "막히면 하비 코치에게 물어보기" → C-02 */
export function AskCoachButton() {
  return (
    <Touchable accessibilityLabel="하비 코치에게 물어보기" onPress={() => go('/chat/conversation')} style={styles.coach}>
      <IconSlot name="chat-spark" size={18} color="brandDeep" />
      <AppText variant="callout14Bold" color="brandDeep" style={styles.flex}>
        막히면 하비 코치에게 물어보기
      </AppText>
      <IconSlot name="chev" size={18} color="brandDeep" />
    </Touchable>
  );
}

/** 하단 고정 완료 버튼 (아이콘 + 라벨) */
export function DoneButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Touchable accessibilityLabel={label} onPress={onPress} style={styles.done}>
      <IconSlot name="check" size={18} color="textOnDark" />
      <AppText variant="body16Bold" color="textOnDark">
        {label}
      </AppText>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  steps: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  stepDivider: { borderBottomWidth: 1, borderBottomColor: COLORS.borderDefault },
  stepCheck: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  stepCheckOn: { backgroundColor: COLORS.brandPrimary },
  stepCheckOff: { borderWidth: 2, borderColor: COLORS.borderStrong },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: COLORS.bgForest,
  },
  pause: { padding: 10, borderRadius: 999, backgroundColor: COLORS.onDarkGlass },
  coach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgGreenSoft,
  },
  done: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: COLORS.brandPrimary,
  },
});
