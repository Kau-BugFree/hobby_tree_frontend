/**
 * E-02 선택한 난이도 · 세부 활동 목록
 * - 반복 "Activity/…" 행 12개 → ActivityRow + FlatList
 * - 다른 취미 토글 메뉴(HobbyToggleMenu) · 세부 활동 검색 · 페이지 이동(5개씩, 이전/번호/다음)
 * - Figma 문구 원칙: ‘단계’ 표현 대신 단계 이름(예: 추출 방식 탐색)으로 부른다
 */
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, HobbyIcon, IconSlot, STAGE_NAME, Tag, TopBar, Touchable, TreeStage, TreeStageNo } from '../../components';
import { HobbyToggleMenu } from '../../components/HobbyToggleMenu';
import type { HobbyKey } from '../../components/Graphics';
import { CATALOG, CatalogCard, cardsOfLevel, catalogOf, minuteRange } from '../../data/catalog';
import { MAX_FONT_SCALE } from '../../lib/layout';
import { go } from '../../lib/nav';
import { COLORS, shadow, TYPO } from '../../theme';

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

/** 한 페이지에 보여 줄 세부 활동 수 */
const PAGE_SIZE = 5;
const HOBBIES = Object.keys(CATALOG) as HobbyKey[];

/** 검색어가 제목·목표·분류·준비물 중 하나에 들어 있으면 통과 (띄어쓰기·대소문자 무시) */
const norm = (t: string) => t.replace(/\s+/g, '').toLowerCase();
const matches = (card: CatalogCard, q: string) =>
  !q || norm([card.title, card.goal, card.group, ...card.tools, ...card.materials].join(' ')).includes(norm(q));

/** 이전 · 1 2 3 · 다음 페이지 이동 버튼 */
function Pager({ page, pages, onChange }: { page: number; pages: number; onChange: (p: number) => void }) {
  if (pages <= 1) return null;
  return (
    <View style={styles.pager} accessibilityRole="toolbar">
      <Touchable
        accessibilityLabel="이전 페이지"
        disabled={page === 0}
        onPress={() => onChange(page - 1)}
        style={[styles.pageNav, page === 0 && styles.pageOff]}
      >
        <IconSlot name="back" size={16} color="textBody" />
        <AppText variant="caption12Bold" color="textBody">
          이전
        </AppText>
      </Touchable>
      <View style={styles.pageNums}>
        {Array.from({ length: pages }).map((_, i) => (
          <Touchable
            key={i}
            accessibilityLabel={`${i + 1}페이지`}
            accessibilityState={{ selected: i === page }}
            onPress={() => onChange(i)}
            style={[styles.pageNum, i === page && styles.pageNumOn]}
          >
            <AppText variant="callout14Bold" color={i === page ? 'textOnDark' : 'textBody'}>
              {i + 1}
            </AppText>
          </Touchable>
        ))}
      </View>
      <Touchable
        accessibilityLabel="다음 페이지"
        disabled={page === pages - 1}
        onPress={() => onChange(page + 1)}
        style={[styles.pageNav, page === pages - 1 && styles.pageOff]}
      >
        <AppText variant="caption12Bold" color="textBody">
          다음
        </AppText>
        <IconSlot name="chev" size={16} color="textBody" />
      </Touchable>
    </View>
  );
}

export default function StageActivities() {
  const insets = useSafeAreaInsets();
  const { hobby = '커피', stage = '2' } = useLocalSearchParams<{ hobby?: string; stage?: string }>();
  const level = Number(stage);
  const catalog = catalogOf(hobby);
  const cards = cardsOfLevel(catalog, level);
  const treeStage = Math.min(level, 5) as TreeStageNo;

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList<CatalogCard>>(null);
  const searchY = useRef(0);

  const filtered = useMemo(() => cards.filter((c) => matches(c, query.trim())), [cards, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  // 검색어나 취미가 바뀌면 1페이지부터
  useEffect(() => setPage(0), [query, hobby]);

  const goPage = (p: number) => {
    setPage(p);
    // 새 페이지의 첫 활동이 보이도록 검색창 위치로 스크롤
    listRef.current?.scrollToOffset({ offset: Math.max(0, searchY.current - 8), animated: true });
  };

  const changeHobby = (h: HobbyKey) => {
    setQuery('');
    router.setParams({ hobby: h });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar title={catalog.levels[level]} />
      <FlatList
        ref={listRef}
        data={visible}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ActivityRow card={item} />}
        keyboardShouldPersistTaps="handled"
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

            {/* 토글 메뉴: 같은 단계에서 다른 취미의 세부 활동으로 바로 이동 */}
            <HobbyToggleMenu value={catalog.hobby as HobbyKey} options={HOBBIES} onChange={changeHobby} />

            {/* 세부 활동 검색 */}
            <View
              style={styles.search}
              onLayout={(e) => {
                searchY.current = e.nativeEvent.layout.y;
              }}
            >
              <IconSlot name="search" size={18} color="textMuted" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="세부 활동 검색 (예: 드립, 원두)"
                placeholderTextColor={COLORS.textMuted}
                returnKeyType="search"
                accessibilityLabel="세부 활동 검색"
                maxFontSizeMultiplier={MAX_FONT_SCALE}
                style={[TYPO.callout14Regular, styles.input]}
              />
              {query ? (
                <Touchable small accessibilityLabel="검색어 지우기" onPress={() => setQuery('')}>
                  <IconSlot name="clear" size={18} color="textMuted" />
                </Touchable>
              ) : null}
            </View>

            <View style={styles.sectionHead}>
              <AppText variant="headline18Bold" color="textPrimary">
                {query.trim() ? `검색 결과 ${filtered.length}개` : `세부 활동 ${cards.length}개`}
              </AppText>
              <AppText variant="caption12Bold" color="textMuted">
                {filtered.length ? `${current + 1} / ${pages} 페이지` : ''}
              </AppText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <AppText variant="callout14Regular" color="textMuted" align="center" style={styles.empty}>
            {`‘${query.trim()}’와 맞는 활동이 없어요`}
          </AppText>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Pager page={current} pages={pages} onChange={goPage} />
            <AppText variant="micro11Bold" color="textMuted">
              {`활동 목록 출처: HobbyTree ${catalog.hobby} 성장 지도 (첨부 HTML, 2026.10.09 초안)`}
            </AppText>
          </View>
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
  search: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  input: { flex: 1, color: COLORS.textPrimary, padding: 0, includeFontPadding: false },
  empty: { paddingVertical: 24 },
  footer: { gap: 14, paddingTop: 6 },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pageNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  pageOff: { opacity: 0.4 },
  pageNums: { flexDirection: 'row', gap: 6 },
  pageNum: { width: 36, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  pageNumOn: { backgroundColor: COLORS.bgForest },
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
