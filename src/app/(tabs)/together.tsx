/**
 * T-01 함께 · 원데이 클래스 추천
 * - 헤더: 새 나무 + 채팅(준비 중 → T-03)
 * - 취미 필터 칩(단일 선택) → 대표 클래스 카드(FeaturedClassCard) + 근처 다른 활동(NearbyRow)
 * - 근처 활동: 준비 중 클래스 → T-06 상세, 공공 프로그램 → 외부 이동 안내(OV-02)
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppText,
  ChatbotFab,
  Chip,
  IconSlot,
  IconTile,
  IllustrationSlot,
  PlantTreeButton,
  SectionTitle,
  TAB_BAR_HEIGHT,
  TabHeader,
  Tag,
  Touchable,
} from '../../components';
import type { HobbyKey } from '../../components/Graphics';
import { CLASSES, ClassItem, TOGETHER_FILTERS } from '../../data/together';
import { withComma } from '../../lib/appState';
import { go } from '../../lib/nav';
import { COLORS, shadow } from '../../theme';

function ChatButton() {
  return (
    <Touchable accessibilityLabel="채팅, 준비 중" onPress={() => go('/together/chat-soon')} style={styles.chatBtn}>
      <IconSlot name="chat" size={18} color="brandDeep" />
      <AppText variant="callout14Bold" color="brandDeep">
        채팅
      </AppText>
      <Tag label="준비 중" tone="gray" />
    </Touchable>
  );
}

const openClass = (c: ClassItem) =>
  c.external ? go(`/overlay/external?title=${encodeURIComponent(c.host)}`) : go(`/together/class/${c.id}`);

function FeaturedClassCard({ item }: { item: ClassItem }) {
  return (
    <Touchable accessibilityLabel={item.title} onPress={() => openClass(item)} style={[styles.featured, FEATURED_SHADOW]}>
      <View style={styles.featuredImage}>
        <IllustrationSlot name={`class-${item.id}`} width={180} height={108} />
        <View style={styles.imageTags}>
          <Tag label={item.kind === '원데이' ? '원데이 클래스' : '공공 프로그램'} tone="solid" />
          {item.partner ? <Tag label="제휴" tone="ad" /> : null}
          {!item.bookable && !item.external ? <Tag label="준비 중" tone="gray" /> : null}
        </View>
      </View>
      <View style={styles.featuredBody}>
        <AppText variant="headline18Bold" color="textPrimary">
          {item.title}
        </AppText>
        <View style={styles.rowGap6}>
          <IconSlot name="pin" size={14} color="textMuted" />
          <AppText variant="caption12Medium" color="textMuted">
            {`${item.area.split(' · ')[0].replace('동', '')} · ${item.host}`}
          </AppText>
        </View>
        <View style={styles.rowGap6}>
          <IconSlot name="calendar" size={14} color="textMuted" />
          <AppText variant="caption12Medium" color="textMuted">
            {item.whenShort}
          </AppText>
        </View>
        <View style={styles.priceRow}>
          <AppText variant="body16Bold" color="brandDeep">
            {item.price ? `${withComma(item.price)}원` : '무료'}
          </AppText>
          <Tag label={`${item.hobby} ${item.stage}단계 활동으로 인정`} tone="water" />
        </View>
      </View>
    </Touchable>
  );
}

function NearbyRow({ item }: { item: ClassItem }) {
  return (
    <Touchable accessibilityLabel={item.title} onPress={() => openClass(item)} style={styles.nearby}>
      <IconTile size={46} radius={14}>
        <IconSlot name={`hobby-${item.hobby}`} size={22} color="brandDeep" />
      </IconTile>
      <View style={styles.nearbyText}>
        <Tag label={item.kind} tone={item.kind === '공공' ? 'gray' : 'khaki'} />
        <AppText variant="callout14Bold" color="textPrimary">
          {item.title}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {item.whenShort}
        </AppText>
      </View>
      <IconSlot name="chev" size={18} color="textMuted" />
    </Touchable>
  );
}

export default function TogetherScreen() {
  const insets = useSafeAreaInsets();
  const [hobby, setHobby] = useState<HobbyKey>('커피');
  const featured = CLASSES.find((c) => c.hobby === hobby && c.kind === '원데이');
  const nearby = CLASSES.filter((c) => c !== featured);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TabHeader
        eyebrow="밖에서 함께하는 취미"
        title="함께"
        actions={
          <>
            <PlantTreeButton />
            <ChatButton />
          </>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filters} accessibilityRole="radiogroup">
          {TOGETHER_FILTERS.map((h) => (
            <Chip key={h} label={h} selected={hobby === h} onPress={() => setHobby(h)} />
          ))}
        </View>
        {featured ? (
          <FeaturedClassCard item={featured} />
        ) : (
          <View style={styles.empty}>
            <AppText variant="callout14Bold" color="textBody">
              {`아직 ${hobby} 원데이 클래스가 없어요`}
            </AppText>
            <AppText variant="caption12Medium" color="textMuted">
              근처 다른 활동을 먼저 둘러보세요.
            </AppText>
          </View>
        )}
        <SectionTitle title="근처 다른 활동" right={`${nearby.length}곳`} />
        {nearby.map((c) => (
          <NearbyRow key={c.id} item={c} />
        ))}
      </ScrollView>
      <ChatbotFab />
    </View>
  );
}

/** Featured class: shadow(0,10,24,#0D330D@0.12) */
const FEATURED_SHADOW = shadow(COLORS.shadowForest, 10, 24, 0.12, 6);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  content: { gap: 12, paddingTop: 2, paddingHorizontal: 24 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featured: { borderRadius: 30, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault, overflow: 'hidden' },
  featuredImage: { height: 132, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bgKhaki },
  imageTags: { position: 'absolute', top: 14, left: 16, flexDirection: 'row', gap: 6 },
  featuredBody: { gap: 6, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  empty: { gap: 4, padding: 20, borderRadius: 24, backgroundColor: COLORS.bgSunken, alignItems: 'center' },
  nearby: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  nearbyText: { flex: 1, gap: 2 },
});
