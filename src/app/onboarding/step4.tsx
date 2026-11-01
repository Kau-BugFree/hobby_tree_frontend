/**
 * O-05 온보딩 4/4 · 확인
 * - 반복 구조 "Summary/…" 카드 3개 → SummaryCard 서브 컴포넌트
 * - 값은 앞 단계 답변(앱 상태)에서 계산
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, IconSlot, Screen, Touchable } from '../../components';
import { OnboardingBar, StepTitle } from '../../components/onboarding/OnboardingParts';
import { useAppState } from '../../lib/appState';
import { go } from '../../lib/nav';
import { summarize } from '../../lib/summary';
import { COLORS } from '../../theme';

interface SummaryRow {
  label: string;
  value: string;
}

interface SummaryCardProps {
  title: string;
  editHref: string;
  rows: SummaryRow[];
}

function SummaryCard({ title, editHref, rows }: SummaryCardProps) {
  return (
    <Card radius={22} gap={10}>
      <View style={styles.cardHead}>
        <AppText variant="body16Bold" color="textPrimary">
          {title}
        </AppText>
        <Touchable small accessibilityLabel={`${title} 수정`} onPress={() => go(editHref)} style={styles.edit}>
          <IconSlot name="pen" size={14} color="brandPrimary" />
          <AppText variant="caption12Bold" color="brandPrimary">
            수정
          </AppText>
        </Touchable>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={styles.row}>
          <AppText variant="caption12Bold" color="textMuted" style={styles.rowLabel}>
            {r.label}
          </AppText>
          <AppText variant="caption12Medium" color="textBody" style={styles.flex}>
            {r.value}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

const STEP = {
  eyebrow: '4/4 · 확인',
  title: '이렇게 이해했어요',
  lead: '추천 전에 한 번만 확인해 주세요. 언제든 MY에서 바꿀 수 있어요.',
};

export default function OnboardingStep4() {
  const { state } = useAppState();
  const s = summarize(state);
  const cards: SummaryCardProps[] = [
    {
      title: '상태 · 관심 · 목적',
      editHref: '/onboarding/step1',
      rows: [
        { label: '취미 상태', value: s.status },
        { label: '관심 취미', value: s.interests },
        { label: '얻고 싶은 것', value: s.goals },
      ],
    },
    {
      title: '예산 · 시간',
      editHref: '/onboarding/step2',
      rows: [
        { label: '첫 활동', value: s.firstSpend },
        { label: '이번 달 전체', value: s.monthly },
        { label: '한 번에', value: s.session },
        { label: '일주일', value: s.weekly },
      ],
    },
    {
      title: '물품 · 환경',
      editHref: '/onboarding/step3',
      rows: [
        { label: '쓸 수 있는 물건', value: s.items },
        { label: '선호 장소', value: s.place },
        { label: '반드시 제외', value: s.exclude },
        { label: '처음 함께', value: s.company },
      ],
    },
  ];

  return (
    <Screen
      header={<OnboardingBar progress="4/4" filled={4} />}
      footer={<Button label="이대로 추천 받기" onPress={() => go('/onboarding/summary')} />}
      contentStyle={styles.content}
    >
      <StepTitle step={STEP} />
      <View style={styles.cards}>
        {cards.map((c) => (
          <SummaryCard key={c.title} {...c} />
        ))}
        <View style={styles.unknown}>
          <IconSlot name="info" size={16} color="brandPrimary" />
          <AppText variant="caption12Medium" color="textBody" style={styles.flex}>
            ‘모르겠어요’로 둔 항목은 미확인으로 저장하고, 추천 후보에 꼭 필요할 때만 다시 물어봐요. 나이·직업·거주 형태는 추천에 쓰지 않아요.
          </AppText>
        </View>
        <Touchable accessibilityLabel="추천 전에 더 알려 주기" onPress={() => go('/onboarding/optional')} style={styles.optional}>
          <View style={styles.flex}>
            <AppText variant="body16Bold" color="brandDeep">
              추천 전에 더 알려 주기 · 선택
            </AppText>
            <AppText variant="caption12Medium" color="textBody">
              다음 활동 고르는 방식 · 기록 방식 · 부담스러운 요소 · 하고 싶은 말
            </AppText>
          </View>
          <IconSlot name="chev" size={18} color="brandDeep" />
        </Touchable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 18 },
  cards: { gap: 12 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingLeft: 6, paddingRight: 2 },
  row: { flexDirection: 'row', gap: 10 },
  rowLabel: { width: 84 },
  unknown: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: COLORS.bgGreenSoft,
  },
  optional: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: COLORS.bgKhaki,
  },
});
