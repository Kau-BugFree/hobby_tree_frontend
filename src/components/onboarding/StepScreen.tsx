import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { OnboardingStepDef } from '../../data/onboarding';
import { go } from '../../lib/nav';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Screen } from '../Screen';
import { Touchable } from '../Touchable';
import { OnboardingBar, QuestionBlock, StepTitle } from './OnboardingParts';

export interface StepScreenProps {
  step: OnboardingStepDef;
  next: string;
  nextLabel?: string;
  /** 하단 보조 링크 (예: 건너뛰기) */
  secondary?: { label: string; href: string };
  /** 질문 목록 뒤에 붙는 화면 고유 블록 */
  extra?: React.ReactNode;
  keyboard?: boolean;
}

/** O-02 · O-03 · O-04 · O-05-1 공통: 진행 막대 + 제목 + 질문 목록 + 하단 버튼 */
export function StepScreen({ step, next, nextLabel = '다음', secondary, extra, keyboard }: StepScreenProps) {
  return (
    <Screen
      keyboard={keyboard}
      header={<OnboardingBar progress={step.progress} filled={step.filled} />}
      footer={
        <>
          <Button label={nextLabel} onPress={() => go(next)} />
          {secondary ? (
            <Touchable small onPress={() => go(secondary.href)} style={styles.secondary}>
              <AppText variant="callout14Bold" color="textMuted">
                {secondary.label}
              </AppText>
            </Touchable>
          ) : null}
        </>
      }
      contentStyle={styles.content}
    >
      <StepTitle step={step} />
      <View style={styles.questions}>
        {step.questions.map((q) => (
          <QuestionBlock key={q.code} q={q} />
        ))}
        {extra}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  questions: { gap: 24 },
  secondary: { paddingVertical: 6 },
});
