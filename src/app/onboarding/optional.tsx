/**
 * O-05-1 선택 설정 · Q11~Q14
 * - Q14 자유 입력(TextInput) → KeyboardAvoidingView 적용
 * - 해석 결과(Parsed constraints)는 AI 파트 응답을 표시하는 자리 (현재는 MOCK)
 */
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppText, ChipGroup, IconSlot, InfoNote, QuestionHead } from '../../components';
import { StepScreen } from '../../components/onboarding/StepScreen';
import { OPTIONAL } from '../../data/onboarding';
import { useAppState } from '../../lib/appState';
import { COLORS, TYPO } from '../../theme';

/** TODO(AI): 자유 입력을 서버의 제약 조건 추출 API로 보내 받은 결과로 교체 */
const MOCK_PARSED = ['보유 · 기타', '시간대 · 밤', '제외 · 새 장비 구매'];
const MAX_LEN = 200;

function FreeTextQuestion() {
  const { state, update, setAnswer } = useAppState();
  return (
    <View style={styles.q}>
      <QuestionHead code="Q14" rule="자유 입력" title="추천할 때 더 고려했으면 하는 점이 있나요?" />
      <View style={styles.input}>
        <TextInput
          value={state.freeText}
          onChangeText={(t) => update({ freeText: t.slice(0, MAX_LEN) })}
          multiline
          maxLength={MAX_LEN}
          placeholder="예: 밤에만 할 수 있어요"
          placeholderTextColor={COLORS.textMuted}
          style={[TYPO.callout14Regular, styles.textInput]}
          accessibilityLabel="추천할 때 더 고려했으면 하는 점"
        />
        <AppText variant="micro11Bold" color="textMuted" align="right">
          {`${state.freeText.length} / ${MAX_LEN}`}
        </AppText>
      </View>
      {state.freeText.trim().length > 0 ? (
        <View style={styles.parsed}>
          <View style={styles.parsedHead}>
            <IconSlot name="spark" size={16} color="brandPrimary" />
            <AppText variant="caption12Bold" color="brandDeep">
              이렇게 이해했어요 · 맞는지 확인해 주세요
            </AppText>
          </View>
          <View style={styles.pills}>
            {MOCK_PARSED.map((p) => (
              <View key={p} style={styles.pill}>
                <AppText variant="caption12Bold" color="textPrimary">
                  {p}
                </AppText>
              </View>
            ))}
          </View>
          <ChipGroup
            options={['맞아요', '고칠게요'] as const}
            value={(state.answers.parseConfirm as '맞아요' | '고칠게요') ?? null}
            onChange={(v) => setAnswer('parseConfirm', v)}
          />
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
      next="/onboarding/summary"
      nextLabel="저장하고 추천 받기"
      secondary={{ label: '건너뛰기', href: '/onboarding/summary' }}
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
  parsed: { gap: 10, padding: 14, borderRadius: 18, backgroundColor: COLORS.bgGreenSoft },
  parsedHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: COLORS.bgSurface },
});
