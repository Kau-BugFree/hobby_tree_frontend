/**
 * E-02 선택한 난이도 · 세부 활동 목록 — 화면 모양 (Figma v6)
 * 체험 모드(카탈로그)와 로그인 상태(API-23·24)가 같은 화면을 쓰도록 데이터만 받아 그린다.
 * - 나무 단계 히어로 · 다른 취미 토글 메뉴 · 세부 활동 검색 · 5개씩 페이지 이동
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_FONT_SCALE } from '../../lib/layout';
import { COLORS, shadow, TYPO } from '../../theme';
import { AppText } from '../AppText';
import type { HobbyKey, TreeStageNo } from '../Graphics';
import { HobbyIcon, TreeStage } from '../Graphics';
import { HobbyToggleMenu } from '../HobbyToggleMenu';
import { IconSlot } from '../IconSlot';
import { Tag } from '../Tag';
import { TopBar } from '../TopBar';
import { Touchable } from '../Touchable';

export interface StageCardView {
  id: string;
  title: string;
  tag: string;
  minutes?: number | null;
  goal?: string;
  /** ‘준비물 · …’ 한 줄 */
  prep?: string;
  /** 검색에 쓸 글 */
  searchText: string;
  onPress: () => void;
  saved?: boolean;
}

export interface StageListModel {
  title: string;
  hobby: HobbyKey;
  treeStage: TreeStageNo;
  eyebrow: string;
  summary: string;
  cards: StageCardView[];
  hobbyOptions: readonly HobbyKey[];
  onChangeHobby: (h: HobbyKey) => void;
  footnote?: string;
  /** 서버: 마지막 페이지에 오면 다음 활동을 더 불러오기 */
  onEndReached?: () => void;
  loading?: boolean;
  emptyText?: string;
}

function ActivityRow({ card }: { card: StageCardView }) {
  return (
    <Touchable accessibilityLabel={card.title} onPress={card.onPress} style={styles.row}>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <Tag label={card.tag} tone="khaki" />
          {card.minutes ? (
            <>
              <IconSlot name="clock" size={12} color="textMuted" />
              <AppText variant="micro11Bold" color="textMuted">
                {`${card.minutes}분`}
              </AppText>
            </>
          ) : null}
          {card.saved ? <IconSlot name="bookmark" size={12} color="brandPrimary" /> : null}
        </View>
        <AppText variant="body16Bold" color="textPrimary">
          {card.title}
        </AppText>
        {card.goal ? (
          <AppText variant="caption12Medium" color="textBody">
            {card.goal}
          </AppText>
        ) : null}
        {card.prep ? (
          <View style={styles.rowGap4}>
            <IconSlot name="bag" size={12} color="brandPrimary" />
            <AppText variant="micro11Bold" color="brandPrimary" numberOfLines={1} style={styles.flex}>
              {card.prep}
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
const norm = (t: string) => t.replace(/\s+/g, '').toLowerCase();

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

export function StageListView({ m }: { m: StageListModel }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList<StageCardView>>(null);
  const searchY = useRef(0);

  const filtered = useMemo(() => m.cards.filter((c) => !query.trim() || norm(c.searchText).includes(norm(query.trim()))), [m.cards, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  // 검색어나 취미·단계가 바뀌면 1페이지부터
  useEffect(() => setPage(0), [query, m.hobby, m.title]);
  // 마지막 페이지에 오면 서버에서 다음 활동을 더 받는다
  useEffect(() => {
    if (current === pages - 1) m.onEndReached?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, pages]);

  const goPage = (p: number) => {
    setPage(p);
    // 새 페이지의 첫 활동이 보이도록 검색창 위치로 스크롤
    listRef.current?.scrollToOffset({ offset: Math.max(0, searchY.current - 8), animated: true });
  };

  const changeHobby = (h: HobbyKey) => {
    setQuery('');
    m.onChangeHobby(h);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar title={m.title} />
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
                <TreeStage stage={m.treeStage} scale={75 / 300} />
              </View>
              <View style={styles.flex}>
                <View style={styles.rowGap6}>
                  <HobbyIcon hobby={m.hobby} size={14} color="textOnDarkMuted" />
                  <AppText variant="caption12Bold" color="textOnDarkMuted">
                    {m.eyebrow}
                  </AppText>
                </View>
                <AppText variant="title22Bold" color="textOnDark">
                  {m.title}
                </AppText>
                <AppText variant="caption12Medium" color="textOnDarkMuted">
                  {m.summary}
                </AppText>
              </View>
            </LinearGradient>

            {/* 토글 메뉴: 같은 단계에서 다른 취미의 세부 활동으로 바로 이동 */}
            {m.hobbyOptions.length > 1 ? <HobbyToggleMenu value={m.hobby} options={m.hobbyOptions} onChange={changeHobby} /> : null}

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
                placeholder="세부 활동 검색 (예: 계량, 반죽)"
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
                {query.trim() ? `검색 결과 ${filtered.length}개` : `세부 활동 ${m.cards.length}개`}
              </AppText>
              <AppText variant="caption12Bold" color="textMuted">
                {filtered.length ? `${current + 1} / ${pages} 페이지` : ''}
              </AppText>
            </View>
          </View>
        }
        ListEmptyComponent={
          <AppText variant="callout14Regular" color="textMuted" align="center" style={styles.empty}>
            {m.loading ? '활동을 불러오는 중…' : query.trim() ? `‘${query.trim()}’와 맞는 활동이 없어요` : (m.emptyText ?? '아직 활동이 없어요')}
          </AppText>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Pager page={current} pages={pages} onChange={goPage} />
            {m.footnote ? (
              <AppText variant="micro11Bold" color="textMuted">
                {m.footnote}
              </AppText>
            ) : null}
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
