/**
 * E-02 선택한 난이도 · 세부 활동 목록
 * - 반복 "Activity/…" 행 12개 → ActivityRow + FlatList
 * - Figma 문구 원칙: ‘단계’ 표현 대신 단계 이름(예: 추출 방식 탐색)으로 부른다
 */
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, HobbyIcon, IconSlot, STAGE_NAME, Tag, TopBar, Touchable, TreeStage, TreeStageNo } from '../../components';
import type { HobbyKey } from '../../components/Graphics';
import { CatalogCard, cardsOfLevel, catalogOf, minuteRange } from '../../data/catalog';
import { go } from '../../lib/nav';
import { COLORS, shadow } from '../../theme';

function ActivityRow({ card }: { card: CatalogCard }) {
  const prep = [...card.tools, ...card.materials].join(', ');
  return (
    <Touchable accessibilityLabel={card.title} onPress={() => go(`/experience/detail?id=${card.id}`)} style={styles.row}>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <Tag label={card.group} tone="khaki" />
          <IconSlot name="clock" size={12} color="textMuted" />
          <AppText variant="micro11Bold" color="textMuted">
            {`${card.minutes}분`}
          </AppText>
        </View>
        <AppText variant="body16Bold" color="textPrimary">
          {card.title}
        </AppText>
        <AppText variant="caption12Medium" color="textBody">
          {card.goal}
        </AppText>
        {prep ? (
          <View style={styles.rowGap4}>
            <IconSlot name="bag" size={12} color="brandPrimary" />
            <AppText variant="micro11Bold" color="brandPrimary" numberOfLines={1} style={styles.flex}>
              {`준비물 · ${prep}`}
            </AppText>
          </View>
        ) : null}
      </View>
      <IconSlot name="chev" size={18} color="textMuted" />
    </Touchable>
  );
}

export default function StageActivities() {
  const insets = useSafeAreaInsets();
  const { hobby = '커피', stage = '2' } = useLocalSearchParams<{ hobby?: string; stage?: string }>();
  const level = Number(stage);
  const catalog = catalogOf(hobby);
  const cards = cardsOfLevel(catalog, level);
  const treeStage = Math.min(level, 5) as TreeStageNo;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar title={catalog.levels[level]} />
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ActivityRow card={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <LinearGradient colors={[COLORS.bgForest2, COLORS.bgForest]} style={[styles.hero, HERO_SHADOW]}>
              <View style={styles.heroTree}>
                <TreeStage stage={treeStage} scale={75 / 300} />
              </View>
              <View style={styles.flex}>
                <View style={styles.rowGap6}>
                  <HobbyIcon hobby={hobby as HobbyKey} size={14} color="textOnDarkMuted" />
                  <AppText variant="caption12Bold" color="textOnDarkMuted">
                    {`${catalog.hobby} · ${level <= 5 ? STAGE_NAME[treeStage] : '세계수 이후'}`}
                  </AppText>
                </View>
                <AppText variant="title22Bold" color="textOnDark">
                  {catalog.levels[level]}
                </AppText>
                <AppText variant="caption12Medium" color="textOnDarkMuted">
                  {`${catalog.summaries[level]} · 활동 ${cards.length}개 · 한 번에 ${minuteRange(cards)}`}
                </AppText>
              </View>
            </LinearGradient>
            <View style={styles.sectionHead}>
              <AppText variant="headline18Bold" color="textPrimary">
                {`세부 활동 ${cards.length}개`}
              </AppText>
              <AppText variant="caption12Bold" color="textMuted">
                골라서 해도 돼요
              </AppText>
            </View>
          </View>
        }
        ListFooterComponent={
          <AppText variant="micro11Bold" color="textMuted">
            {`활동 목록 출처: HobbyTree ${catalog.hobby} 성장 지도 (첨부 HTML, 2026.10.09 초안)`}
          </AppText>
        }
      />
    </View>
  );
}

const HERO_SHADOW = shadow(COLORS.shadowForest, 10, 22, 0.25, 8);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  list: { gap: 10, paddingTop: 6, paddingHorizontal: 24 },
  header: { gap: 10 },
  rowGap4: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingLeft: 12, paddingRight: 16, borderRadius: 28 },
  heroTree: {
    width: 76,
    height: 76,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.onDarkTile,
    overflow: 'hidden',
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    borderRadius: 20,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
});
