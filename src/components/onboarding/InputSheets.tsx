import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { formatMinutes, withComma } from '../../lib/appState';
import { back } from '../../lib/nav';
import { COLORS, TYPO } from '../../theme';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Chip } from '../Chip';
import { OverlaySheet } from '../Overlay';

function SheetHead({ code, title }: { code: string; title: string }) {
  return (
    <View style={styles.head}>
      <View style={styles.badge}>
        <AppText variant="micro11Bold" color="brandDeep">
          {code}
        </AppText>
      </View>
      <AppText variant="headline18Bold" color="textPrimary" style={styles.flex}>
        {title}
      </AppText>
    </View>
  );
}

export interface AmountSheetProps {
  code: string;
  title: string;
  help: string;
  initial: number;
  max: number;
  quickAdd: { label: string; value: number }[];
  onConfirm: (won: number) => void;
}

/**
 * O-03-1 · O-03-2 직접 금액 입력 시트.
 * Figma의 숫자 키패드 그림 대신 시스템 숫자 키보드(number-pad)를 띄운다.
 */
export function AmountSheet({ code, title, help, initial, max, quickAdd, onConfirm }: AmountSheetProps) {
  const [won, setWon] = useState(initial);
  const invalid = won % 1000 !== 0;
  const set = (n: number) => setWon(Math.max(0, Math.min(max, n)));

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <OverlaySheet gap={14}>
        <SheetHead code={code} title={title} />
        <View style={styles.display}>
          <TextInput
            autoFocus
            keyboardType="number-pad"
            value={won ? withComma(won) : ''}
            placeholder="0"
            placeholderTextColor={COLORS.borderStrong}
            onChangeText={(t) => set(Number(t.replace(/[^0-9]/g, '')) || 0)}
            style={[TYPO.display34Black, styles.amountInput]}
            accessibilityLabel={`${title} 금액`}
            maxLength={11}
          />
          <AppText variant="title22Bold" color="textBody">
            원
          </AppText>
        </View>
        <View style={styles.underline} />
        <AppText variant="caption12Medium" color={invalid ? 'accentDanger' : 'textMuted'}>
          {invalid ? '1,000원 단위로 입력해 주세요' : help}
        </AppText>
        <View style={styles.quick}>
          {quickAdd.map((q) => (
            <Chip key={q.label} label={q.label} onPress={() => set(won + q.value)} />
          ))}
        </View>
        <Button
          label="확인"
          disabled={invalid}
          onPress={() => {
            onConfirm(won);
            back();
          }}
        />
      </OverlaySheet>
    </KeyboardAvoidingView>
  );
}

const ROW_H = 44;
const HOURS = Array.from({ length: 9 }, (_, i) => i); // 0~8시간
const MINUTES = [0, 10, 20, 30, 40, 50];

interface WheelProps {
  label: string;
  values: number[];
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}

/** 휠 한 줄: 화면 안 세로 스크롤 + 44pt 단위 스냅 (Figma "Hours/Minutes (세로 스크롤)") */
function Wheel({ label, values, value, format, onChange }: WheelProps) {
  const ref = useRef<ScrollViewInstance>(null);
  const index = Math.max(0, values.indexOf(value));
  useEffect(() => {
    ref.current?.scrollTo({ y: index * ROW_H, animated: true });
  }, [index]);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.y / ROW_H);
    const v = values[Math.max(0, Math.min(values.length - 1, i))];
    if (v !== value) onChange(v);
  };
  return (
    <ScrollView
      ref={ref}
      accessibilityLabel={label}
      style={styles.wheel}
      contentContainerStyle={{ paddingVertical: ROW_H * 2 }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ROW_H}
      decelerationRate="fast"
      contentOffset={{ x: 0, y: index * ROW_H }}
      onMomentumScrollEnd={onEnd}
      onScrollEndDrag={onEnd}
    >
      {values.map((v) => (
        <View key={v} style={styles.wheelRow}>
          <AppText variant={v === value ? 'headline18Bold' : 'body16Regular'} color={v === value ? 'textPrimary' : 'textMuted'}>
            {format(v)}
          </AppText>
        </View>
      ))}
    </ScrollView>
  );
}

export interface TimeSheetProps {
  initialMinutes: number;
  onConfirm: (minutes: number) => void;
}

const MAX_MIN = 8 * 60;
const QUICK_TIME = [
  { label: '+10분', add: 10 },
  { label: '+30분', add: 30 },
  { label: '+1시간', add: 60 },
  { label: '반나절 4시간', set: 240 },
];

/** O-03-3 Q06 직접 시간 입력 시트: 빠른 추가 + 시간·분 휠 */
export function TimeSheet({ initialMinutes, onConfirm }: TimeSheetProps) {
  const [mins, setMins] = useState(initialMinutes);
  const clamp = (m: number) => Math.max(10, Math.min(MAX_MIN, Math.round(m / 10) * 10));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return (
    <OverlaySheet gap={14}>
      <SheetHead code="Q06" title="한 번에 할 수 있는 시간" />
      <AppText variant="display34Black" color="textPrimary" style={styles.timeDisplay}>
        {formatMinutes(mins)}
      </AppText>
      <View style={styles.underline} />
      <AppText variant="caption12Medium" color="textMuted">
        준비·정리·이동까지 모두 포함한 한 번의 시간이에요 · 10분 단위 · 최대 8시간
      </AppText>
      <View style={styles.quick}>
        {QUICK_TIME.map((q) => (
          <Chip key={q.label} label={q.label} onPress={() => setMins(clamp(q.set ?? mins + (q.add ?? 0)))} />
        ))}
      </View>
      <View style={styles.picker}>
        <View pointerEvents="none" style={styles.band} />
        <Wheel label="시간" values={HOURS} value={h} format={(v) => `${v}시간`} onChange={(v) => setMins(clamp(v * 60 + m))} />
        <Wheel
          label="분"
          values={MINUTES}
          value={m}
          format={(v) => `${String(v).padStart(2, '0')}분`}
          onChange={(v) => setMins(clamp(h * 60 + v))}
        />
      </View>
      <Button
        label="확인"
        onPress={() => {
          onConfirm(mins);
          back();
        }}
      />
    </OverlaySheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { backgroundColor: COLORS.bgKhaki, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 8 },
  display: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingTop: 6, paddingBottom: 2 },
  amountInput: { color: COLORS.textPrimary, padding: 0, minWidth: 40, includeFontPadding: false },
  timeDisplay: { paddingTop: 6, paddingBottom: 2 },
  underline: { height: 2, alignSelf: 'stretch', backgroundColor: COLORS.brandPrimary },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  picker: {
    height: ROW_H * 5,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.bgSunken,
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: ROW_H * 2,
    height: ROW_H,
    borderRadius: 12,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  wheel: { flex: 1 },
  wheelRow: { height: ROW_H, alignItems: 'center', justifyContent: 'center' },
});
