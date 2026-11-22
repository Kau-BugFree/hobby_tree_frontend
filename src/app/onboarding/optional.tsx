/**
 * O-05-1 선택 설정 · Q11~Q14
 * - Q14 자유 입력(TextInput) → questionnaire.context_text 로 저장 (answers 안이 아님)
 * - 추천 엔진은 자유 입력을 자동으로 해석하지 않는다 → 글이 있으면 추천 결과가 ‘조건 확인 필요(needs_review)’로 온다
 *   그래서 화면에서 ‘이렇게 이해했어요’ 같은 해석 결과를 지어내지 않고, 확인이 필요하다고만 안내한다
 */
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, IconSlot, InfoNote, QuestionHead } from '../../components';
import { StepScreen } from '../../components/onboarding/StepScreen';
import { OPTIONAL } from '../../data/onboarding';
import { useAppState } from '../../lib/appState';
import { COLORS, TYPO } from '../../theme';

function FreeTextQuestion() {
  const { state, update } = useAppState();
  const max = state.server.options?.questionnaire?.contextTextMaxLength ?? 200;
  const filled = state.freeText.trim().length > 0;
  return (
    <View style={styles.q}>
      <QuestionHead code="Q14" rule="자유 입력 · 선택" title="추천할 때 더 고려했으면 하는 점이 있나요?" />
      <View style={styles.input}>
        <TextInput
          value={state.freeText}
          onChangeText={(t) => update({ freeText: t.slice(0, max) })}
          multiline
          maxLength={max}
          placeholder="예: 밤에만 할 수 있어요"
          placeholderTextColor={COLORS.textMuted}
          style={[TYPO.callout14Regular, styles.textInput]}
          accessibilityLabel="추천할 때 더 고려했으면 하는 점"
        />
        <AppText variant="micro11Bold" color="textMuted" align="right">
          {`${state.freeText.length} / ${max}`}
        </AppText>
      </View>
      {filled ? (
        <View style={styles.review}>
          <IconSlot name="info" size={16} color="brandPrimary" />
          <AppText variant="caption12Medium" color="textBody" style={styles.flex}>
            적어 주신 내용은 자동으로 해석하지 않아요. 추천 전에 조건을 한 번 더 확인하는 단계가 나와요.
          </AppText>
        </View>
      ) : null}
      <InfoNote text="수치·알레르기·건강 상태는 문장만 보고 만들어 내지 않아요." />
    </View>
  );
}

export default function OnboardingOptional() {
  return (
    <StepScreen
      step={OPTIONAL}
      next="/onboarding/terms"
      nextLabel="저장하고 추천 받기"
      nextToast={{ title: '답변을 저장했어요', sub: '언제든 MY에서 바꿀 수 있어요', icon: 'check' }}
      secondary={{ label: '건너뛰기', href: '/onboarding/terms' }}
      extra={<FreeTextQuestion />}
      keyboard
    />
  );
}

const styles = StyleSheet.create({
  q: { gap: 10 },
  input: {
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1.5,
    borderColor: COLORS.brandPrimary,
  },
  textInput: { color: COLORS.textPrimary, minHeight: 44, padding: 0, textAlignVertical: 'top', includeFontPadding: false },
  flex: { flex: 1 },
  review: { flexDirection: 'row', gap: 8, padding: 14, borderRadius: 18, backgroundColor: COLORS.bgGreenSoft },

});
