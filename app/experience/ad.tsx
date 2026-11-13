/**
 * E-03-1 광고 상세
 * - 예산 비교는 온보딩 1회·월 예산(Q04·Q05)과 계산
 * - ‘판매처에서 보기’ → 외부 이동 안내(OV-02)
 */
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, IconSlot, InfoNote, Screen, Tag, TopBar } from '../../components';
import { findAd } from '../../data/experience';
import { formatManWon, formatWon, useAppState, withComma } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

const amountOf = (answer: unknown, custom: number) => {
  if (answer === '직접 금액 입력') return custom;
  const m = String(answer).match(/(\d+)만/);
  return m ? Number(m[1]) * 10000 : 0;
};

function BudgetRow({ label, verdict, ok }: { label: string; verdict: string; ok: boolean }) {
  return (
    <View style={styles.budgetRow}>
      <AppText variant="callout14Regular" color="textMuted">
        {label}
      </AppText>
      <AppText variant="callout14Bold" color={ok ? 'brandPrimary' : 'accentFruit'}>
        {verdict}
      </AppText>
    </View>
  );
}

export default function AdDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { state } = useAppState();
  const ad = findAd(id) ?? findAd('dripper-set')!;
  const perSession = amountOf(state.answers.q04, state.customAmount.q04);
  const monthly = amountOf(state.answers.q05, state.customAmount.q05);
  const over = ad.price - perSession;

  return (
    <Screen
      header={<TopBar title="광고 상세" onAction={() => go('/overlay/more')} />}
      footer={<Button label="판매처에서 보기" onPress={() => go(`/overlay/external?title=${encodeURIComponent(ad.seller)}`)} />}
      contentStyle={styles.content}
    >
      <View style={styles.image}>
        <IconSlot name="product" width={154} height={132} color="brandDeep" />
        <Tag label="광고" tone="ad" style={styles.tagTop} />
      </View>
      <View style={styles.info}>
        <AppText variant="caption12Bold" color="textMuted">
          {`${ad.seller} · 제휴 판매처`}
        </AppText>
        <AppText variant="title22Bold" color="textPrimary">
          {ad.title}
        </AppText>
        <View style={styles.rowGap8}>
          <AppText variant="title22Bold" color="brandDeep">
            {`${withComma(ad.price)}원`}
          </AppText>
          {ad.shipping ? <Tag label={ad.shipping} tone="gray" /> : null}
        </View>
      </View>
      {ad.why?.length ? (
        <View style={styles.why}>
          <AppText variant="body16Bold" color="brandDeep">
            이 활동에 왜 필요할까요?
          </AppText>
          {ad.why.map((w) => (
            <AppText key={w} variant="callout14Regular" color="textBody">
              {`•  ${w}`}
            </AppText>
          ))}
        </View>
      ) : null}
      <View style={styles.budget}>
        <BudgetRow
          label={`1회 예산 ${formatManWon(perSession)}`}
          verdict={over > 0 ? `1회 예산보다 ${formatWon(over)} 커요` : '1회 예산 안이에요'}
          ok={over <= 0}
        />
        <BudgetRow
          label={`월 예산 ${formatManWon(monthly)}`}
          verdict={ad.price <= monthly ? '이번 달 예산 안이에요' : '이번 달 예산을 넘어요'}
          ok={ad.price <= monthly}
        />
        <View style={styles.together}>
          <Tag label="함께" tone="khaki" />
          <AppText variant="caption12Medium" color="textBody">
            원데이 클래스에서 장비 먼저 써 보기
          </AppText>
        </View>
      </View>
      <InfoNote text="광고가 포함된 화면이에요. 구매 시 하비트리가 수수료를 받을 수 있지만 가격과 추천 순서는 같아요." bold />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingTop: 6 },
  rowGap8: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  image: { height: 176, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgKhaki },
  tagTop: { position: 'absolute', top: 16, left: 16 },
  info: { gap: 2 },
  why: { gap: 6, padding: 16, borderRadius: 24, backgroundColor: COLORS.bgGreenSoft },
  budget: {
    gap: 8,
    padding: 16,
    borderRadius: 24,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  together: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
});
