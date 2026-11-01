import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '../../theme';
import { back, go } from '../../lib/nav';
import { AppText } from '../AppText';
import { InfoNote, QuestionHead } from '../Blocks';
import { ChipGroup } from '../Chip';
import { ChoiceGroup } from '../Choice';
import { IconSlot } from '../IconSlot';
import { Touchable } from '../Touchable';
import { formatMinutes, nextSelection, useAppState, withComma } from '../../lib/appState';
import type { OnboardingStepDef, OptionGroupDef, QuestionDef } from '../../data/onboarding';

/** Figma "Onboarding bar": 뒤로 + 4칸 진행 막대 + n/4 */
export function OnboardingBar({ progress, filled }: { progress: string; filled: number }) {
  return (
    <View style={styles.bar}>
      <Touchable accessibilityLabel="뒤로" onPress={() => back()} style={styles.back}>
        <IconSlot name="back" size={20} color="textBody" />
      </Touchable>
      <View style={styles.progress} accessibilityRole="progressbar" accessibilityLabel={`온보딩 ${progress}`}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.seg, { backgroundColor: i < filled ? COLORS.brandPrimary : COLORS.bgSunken }]} />
        ))}
      </View>
      <AppText variant="caption12Bold" color="textMuted">
        {progress}
      </AppText>
    </View>
  );
}

/** 단계 제목 블록 (Figma "Title") */
export function StepTitle({ step }: { step: Pick<OnboardingStepDef, 'eyebrow' | 'title' | 'lead'> }) {
  return (
    <View style={styles.title}>
      <AppText variant="caption12Bold" color="brandPrimary">
        {step.eyebrow}
      </AppText>
      <AppText variant="title26Black" color="brandDeep">
        {step.title}
      </AppText>
      <AppText variant="callout14Regular" color="textMuted">
        {step.lead}
      </AppText>
    </View>
  );
}

/** 직접 입력 칸 (Figma "Amount field" / "Time field") — 누르면 입력 시트 */
function CustomField({ group }: { group: OptionGroupDef }) {
  const { state } = useAppState();
  if (!group.custom) return null;
  const isAmount = group.custom.type === 'amount';
  const value = isAmount
    ? withComma(group.key === 'q04' ? state.customAmount.q04 : state.customAmount.q05)
    : formatMinutes(state.customMinutes);
  const unit = isAmount ? (group.key === 'q04' ? '원 / 첫 활동' : '원 / 이번 달') : '/ 한 번에';
  const help = isAmount
    ? `눌러서 금액을 입력해요 · 1,000원 단위 · 최대 ${group.key === 'q04' ? '100만' : '300만'} 원`
    : '눌러서 시간을 입력해요 · 10분 단위 · 최대 8시간';
  return (
    <View style={styles.customBox}>
      <Touchable
        accessibilityLabel={`${value} ${unit}, 눌러서 바꾸기`}
        onPress={() => go(group.custom!.sheet)}
        style={styles.field}
      >
        <AppText variant="headline18Bold" color="textPrimary" style={styles.flex}>
          {value}
        </AppText>
        <AppText variant="caption12Bold" color="textMuted">
          {unit}
        </AppText>
        <IconSlot name="pen" size={16} color="textMuted" />
      </Touchable>
      <AppText variant="caption12Medium" color="textMuted">
        {help}
      </AppText>
    </View>
  );
}

function OptionGroup({ group }: { group: OptionGroupDef }) {
  const { state, setAnswer } = useAppState();
  const value = state.answers[group.key] ?? null;
  const onChange = (o: string) => {
    setAnswer(group.key, nextSelection(value, o, group.kind, group.exclusive, group.max));
    if (group.custom && o === group.custom.option && value !== o) go(group.custom.sheet);
  };
  const showCustom = !!group.custom && value === group.custom.option;
  return (
    <View style={styles.group}>
      {group.label ? (
        <AppText variant="caption12Bold" color="textMuted">
          {group.label}
        </AppText>
      ) : null}
      {group.display === 'choices' ? (
        <ChoiceGroup options={group.options} value={value} onChange={onChange} />
      ) : (
        <ChipGroup options={group.options} value={value} onChange={onChange} />
      )}
      {showCustom ? <CustomField group={group} /> : null}
    </View>
  );
}

/** 질문 하나 (Figma "QQxx") */
export function QuestionBlock({ q, children }: { q: QuestionDef; children?: React.ReactNode }) {
  return (
    <View style={styles.question}>
      <QuestionHead code={q.code} rule={q.rule} title={q.title} />
      {q.groups.map((g) => (
        <OptionGroup key={g.key} group={g} />
      ))}
      {children}
      {q.note ? <InfoNote text={q.note} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6, paddingHorizontal: 16 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  progress: { flex: 1, flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 6, borderRadius: 3 },
  title: { gap: 6, paddingTop: 14, paddingBottom: 4 },
  question: { gap: 10 },
  group: { gap: 12 },
  customBox: { gap: 6 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1.5,
    borderColor: COLORS.brandPrimary,
  },
});
