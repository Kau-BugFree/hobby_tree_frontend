import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { getOnboardingOptions } from '../../api/endpoints';
import type { OnboardingStepDef } from '../../data/onboarding';
import { useAppState } from '../../lib/appState';
import { go } from '../../lib/nav';
import { AppText } from '../AppText';
import { Button } from '../Button';
import { Screen } from '../Screen';
import { ToastMessage, useToast } from '../Toast';
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
  /** 다음 버튼을 눌렀을 때 띄울 알림 (예: 저장하고 추천 받기 → '답변을 저장했어요') */
  nextToast?: ToastMessage;
}

/** O-02 · O-03 · O-04 · O-05-1 공통: 진행 막대 + 제목 + 질문 목록 + 하단 버튼 */
export function StepScreen({ step, next, nextLabel = '다음', secondary, extra, keyboard, nextToast }: StepScreenProps) {
  const toast = useToast();
  const { state, updateServer } = useAppState();
  // 서버 설문(API-10 questionnaire)을 먼저 받아 선택지 문구를 서버와 맞춘다 (로그인 전에도 가능, 실패하면 앱 정의 사용)
  const hasOptions = !!state.server.options;
  useEffect(() => {
    if (hasOptions) return;
    let alive = true;
    getOnboardingOptions()
      .then((o) => alive && updateServer({ options: o }))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [hasOptions, updateServer]);
  const onNext = () => {
    go(next);
    if (nextToast) toast(nextToast);
  };
  return (
    <Screen
      keyboard={keyboard}
      header={<OnboardingBar progress={step.progress} filled={step.filled} />}
      footer={
        <>
          <Button label={nextLabel} onPress={onNext} />
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
