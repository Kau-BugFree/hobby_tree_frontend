/**
 * O-06 추천 취미 목록 · 선택
 * - 반복 "Toggle · O-06 · …" 카드 → HobbyPickCard 서브 컴포넌트 + FlatList
 * - 최대 5그루
 */
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppText, Button, HobbyIcon, IconSlot, Screen, Tag, Touchable } from '../../components';
import { MAX_TREES, RECOMMENDED, RecommendedHobby } from '../../data/onboarding';
import { useAppState } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS } from '../../theme';

interface HobbyPickCardProps {
  item: RecommendedHobby;
  picked: boolean;
  onToggle: () => void;
}

function HobbyPickCard({ item, picked, onToggle }: HobbyPickCardProps) {
  return (
    <Touchable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: picked }}
      accessibilityLabel={`${item.name}, 잘 맞아요 ${item.match}%`}
      onPress={onToggle}
      style={[styles.card, picked ? styles.cardOn : styles.cardOff]}
    >
      {/* 선택 시 아이콘 칸 색은 유지하고 테두리 + ✓ 배지로 표시 (Figma A안) */}
      <View style={[styles.icon, picked && styles.iconOn]}>
        <HobbyIcon hobby={item.hobby} size={22} color={picked ? 'bgForest' : 'textMuted'} />
        {picked ? (
          <View style={styles.badge}>
            <IconSlot name="check" size={10} color="textOnDark" />
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <AppText variant="body16Bold" color="textPrimary">
            {item.name}
          </AppText>
          <Tag label={`잘 맞아요 ${item.match}%`} tone={picked ? 'green' : 'gray'} />
        </View>
        <AppText variant="caption12Medium" color="textBody">
          {item.why}
        </AppText>
        <AppText variant="caption12Bold" color="brandPrimary">
          {`첫 체험: ${item.firstActivity}`}
        </AppText>
      </View>
      <View style={[styles.check, picked ? styles.checkOn : styles.checkOff]}>
        {picked ? <IconSlot name="check" size={15} color="textOnDark" /> : null}
      </View>
    </Touchable>
  );
}

export default function OnboardingRecommend() {
  const { state, update } = useAppState();
  const toggle = (h: RecommendedHobby['hobby']) => {
    const on = state.picked.includes(h);
    if (!on && state.picked.length >= MAX_TREES) return;
    update({ picked: on ? state.picked.filter((p) => p !== h) : [...state.picked, h] });
  };

  return (
    <Screen
      scroll={false}
      footer={
        <>
          <View style={styles.hint}>
            <IconSlot name="info" size={16} color="brandPrimary" />
            <AppText variant="caption12Medium" color="textMuted">
              나중에 홈에서 더 심을 수 있어요
            </AppText>
          </View>
          <Button
            variant="dark"
            label={`고른 ${state.picked.length}그루 확인하기`}
            disabled={state.picked.length === 0}
            onPress={() => go('/onboarding/confirm')}
          />
        </>
      }
      contentStyle={styles.content}
    >
      <FlatList
        data={RECOMMENDED}
        keyExtractor={(i) => i.hobby}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.head}>
            <AppText variant="title26Black" color="brandDeep">
              {`${state.userName} 님께 맞는 취미예요`}
            </AppText>
            <AppText variant="callout14Regular" color="textMuted">
              {`키우고 싶은 나무를 골라 주세요 · 최대 ${MAX_TREES}그루`}
            </AppText>
          </View>
        }
        renderItem={({ item }) => (
          <HobbyPickCard item={item} picked={state.picked.includes(item.hobby)} onToggle={() => toggle(item.hobby)} />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0, paddingTop: 0 },
  list: { gap: 12, paddingTop: 10, paddingHorizontal: 24, paddingBottom: 24 },
  head: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    backgroundColor: COLORS.bgSurface,
  },
  cardOn: { borderWidth: 2, borderColor: COLORS.brandPrimary },
  cardOff: { borderWidth: 1, borderColor: COLORS.borderDefault },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgSunken,
  },
  iconOn: { borderWidth: 2, borderColor: COLORS.brandPrimary },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    // Figma: 18px 배지 + 바깥 흰 테두리 2px
    width: 22,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.brandPrimary,
    borderWidth: 2,
    borderColor: COLORS.bgSurface,
  },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  check: { width: 26, height: 26, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: COLORS.brandPrimary },
  checkOff: { backgroundColor: COLORS.bgSurface, borderWidth: 2, borderColor: COLORS.borderStrong },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
