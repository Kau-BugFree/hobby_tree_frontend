/**
 * E-04 다른 취미 둘러보기
 * - 검색창(TextInput) + 필터 칩 가로 스크롤 + 남은 자리 + 맞춤 취미 목록(ExploreRow)
 * - ‘심기’ → H-09 새 나무 심기 (Figma는 O-06-1로 연결돼 있으나, 온보딩 이후에는 H-09 흐름이 맞아 변경)
 * 로그인 상태: API-16 GET /hobbies (검색어·카테고리·시간·비용·장소 필터, 커서 ‘더 보기’)
 *   행을 누르면 취미 상세(API-17)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { errorMessage } from '../../api/client';
import { listHobbies } from '../../api/endpoints';
import { hobbyKeyOf } from '../../api/mappers';
import type { HobbyQuery, HobbySummary } from '../../api/types';
import { Button, HobbyIcon } from '../../components';
import { formatMinutes, formatWon, useAppState } from '../../lib/appState';
import { useSession } from '../../lib/session';

import { AppText, Chip, IconSlot, IconTile, Screen, Tag, TopBar, Touchable, TreeStage } from '../../components';
import { EXPLORE_FILTERS, EXPLORE_HOBBIES, ExploreHobby } from '../../data/experience';
import { MAX_TREE_SLOTS, TREES } from '../../data/hobbies';
import { go } from '../../lib/nav';
import { COLORS, TYPO } from '../../theme';

function ExploreRow({ item }: { item: ExploreHobby }) {
  const blocked = !!item.blocked;
  return (
    <View style={styles.row}>
      <IconTile size={48} radius={16} bg={blocked ? 'bgSunken' : 'bgGreenSoft'}>
        <IconSlot name={item.icon} size={24} color={blocked ? 'textMuted' : 'brandDeep'} />
      </IconTile>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <AppText variant="body16Bold" color={blocked ? 'textBody' : 'textPrimary'}>
            {item.name}
          </AppText>
          <Tag label={`맞춤 ${item.match}%`} tone={blocked ? 'gray' : 'green'} />
        </View>
        <AppText variant="caption12Medium" color={blocked ? 'accentDanger' : 'textMuted'}>
          {item.why}
        </AppText>
        <AppText variant="micro11Bold" color="brandPrimary">
          {`0단계 맛보기 · ${item.first}`}
        </AppText>
      </View>
      <Touchable
        accessibilityLabel={`${item.name} 심기`}
        disabled={blocked}
        accessibilityState={{ disabled: blocked }}
        onPress={() => go(`/home/plant?pick=${item.id}`)}
        style={[styles.plant, { backgroundColor: blocked ? COLORS.bgSunken : COLORS.bgForest }]}
      >
        <IconSlot name="plus" size={14} color={blocked ? 'textMuted' : 'textOnDark'} />
        <AppText variant="caption12Bold" color={blocked ? 'textMuted' : 'textOnDark'}>
          심기
        </AppText>
      </Touchable>
    </View>
  );
}

/* ───────── 로그인 상태: 서버 취미 목록 (API-16) ───────── */
interface ServerFilter {
  label: string;
  query: Partial<HobbyQuery>;
}

function useServerFilters(): ServerFilter[] {
  const { state } = useAppState();
  const cats = state.server.options?.categories?.length
    ? state.server.options.categories
    : [
        { categoryId: 1, name: '요리' },
        { categoryId: 2, name: '악기' },
        { categoryId: 3, name: '독서' },
      ];
  return [
    { label: '전체', query: {} },
    ...cats.map((c) => ({ label: c.name, query: { categoryId: c.categoryId } })),
    { label: '실내', query: { indoorOutdoor: 'INDOOR' as const } },
    { label: '30분 이내', query: { maxDurationMinutes: 30 } },
    { label: '1만 원 이하', query: { maxCost: 10000 } },
  ];
}

function ServerHobbyRow({ item }: { item: HobbySummary }) {
  const meta = [
    item.minDurationMinutes != null ? formatMinutes(item.minDurationMinutes) : null,
    item.minCost != null ? (item.minCost === 0 ? '0원' : formatWon(item.minCost)) : null,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Touchable accessibilityLabel={`${item.name} 상세 보기`} onPress={() => go(`/hobby/${item.hobbyId}`)} style={styles.row}>
      <IconTile size={48} radius={16} bg="bgGreenSoft">
        <HobbyIcon hobby={hobbyKeyOf(item.name, item.category?.name)} size={24} />
      </IconTile>
      <View style={styles.flex}>
        <View style={styles.rowGap6}>
          <AppText variant="body16Bold" color="textPrimary">
            {item.name}
          </AppText>
          {item.category?.name ? <Tag label={item.category.name} tone="khaki" /> : null}
          {item.isPlanted ? <Tag label="키우는 중" tone="green" /> : null}
        </View>
        {item.description ? (
          <AppText variant="caption12Medium" color="textMuted" numberOfLines={2}>
            {item.description}
          </AppText>
        ) : null}
        {meta ? (
          <AppText variant="micro11Bold" color="brandPrimary">
            {`첫 체험 · ${meta}`}
          </AppText>
        ) : null}
      </View>
      <IconSlot name="chev" size={18} color="textMuted" />
    </Touchable>
  );
}

function ServerExplore() {
  const filters = useServerFilters();
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState(0);
  const [items, setItems] = useState<HobbySummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  // 검색어는 입력이 멈춘 뒤 0.4초 후에 보낸다
  useEffect(() => {
    const t = setTimeout(() => setKeyword(query.trim().slice(0, 50)), 400);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(
    async (next: string | null) => {
      const id = ++reqId.current;
      setLoading(true);
      setError(null);
      try {
        const page = await listHobbies({ ...filters[filter]?.query, keyword: keyword || undefined, cursor: next, sort: 'NAME' });
        if (id !== reqId.current) return;
        setItems((cur) => (next ? [...cur, ...(page.items ?? [])] : page.items ?? []));
        setCursor(page.nextCursor ?? null);
        setHasNext(!!page.hasNext && !!page.nextCursor);
      } catch (e) {
        if (id === reqId.current) setError(errorMessage(e));
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    },
    // filters는 카테고리 목록이 바뀔 때만 달라진다
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, keyword],
  );

  useEffect(() => {
    load(null);
  }, [load]);

  return (
    <>
      <View style={styles.search}>
        <IconSlot name="search" size={18} color="textMuted" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="어떤 취미가 궁금하세요?"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          maxLength={50}
          style={[TYPO.callout14Regular, styles.input]}
          accessibilityLabel="취미 검색"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
        {filters.map((f, i) => (
          <Chip key={f.label} label={f.label} selected={filter === i} onPress={() => setFilter(i)} />
        ))}
      </ScrollView>
      <View style={styles.sectionHead}>
        <AppText variant="headline18Bold" color="textPrimary">
          {keyword ? `‘${keyword}’ 검색 결과` : '전체 취미'}
        </AppText>
        <AppText variant="caption12Bold" color="textMuted">
          이름순
        </AppText>
      </View>
      {items.map((h) => (
        <ServerHobbyRow key={h.hobbyId} item={h} />
      ))}
      {loading ? <ActivityIndicator color={COLORS.brandPrimary} style={styles.loader} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <AppText variant="callout14Regular" color="textBody" align="center">
            {error}
          </AppText>
          <Button label="다시 시도" variant="outline" hug onPress={() => load(items.length ? cursor : null)} />
        </View>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <AppText variant="callout14Regular" color="textMuted" align="center">
          찾는 취미가 없어요. 검색어나 필터를 바꿔 보세요.
        </AppText>
      ) : null}
      {!loading && !error && hasNext ? <Button label="더 보기" variant="outline" onPress={() => load(cursor)} /> : null}
      <View style={styles.rowGap6}>
        <IconSlot name="info" size={14} color="textMuted" />
        <AppText variant="micro11Bold" color="textMuted" style={styles.flex}>
          시간·비용은 입문 활동 기준 요약값이에요
        </AppText>
      </View>
    </>
  );
}

export default function ExploreScreen() {
  const { signedIn } = useSession();
  if (signedIn) {
    return (
      <Screen keyboard header={<TopBar title="다른 취미 둘러보기" />} contentStyle={styles.content}>
        <ServerExplore />
      </Screen>
    );
  }
  return <MockExplore />;
}

/** 체험 모드: 가짜 데이터 */
function MockExplore() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof EXPLORE_FILTERS)[number]>('전체');
  const list = useMemo(
    () =>
      EXPLORE_HOBBIES.filter((h) => (filter === '전체' || h.tags.includes(filter)) && (!query || h.name.includes(query.trim()))),
    [filter, query],
  );
  const empty = MAX_TREE_SLOTS - TREES.length;

  return (
    <Screen keyboard header={<TopBar title="다른 취미 둘러보기" />} contentStyle={styles.content}>
      <View style={styles.search}>
        <IconSlot name="search" size={18} color="textMuted" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="어떤 취미가 궁금하세요?"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          style={[TYPO.callout14Regular, styles.input]}
          accessibilityLabel="취미 검색"
        />
      </View>
      {/* 필터 칩: 가로 스크롤 (화면 좌우 끝까지) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
        {EXPLORE_FILTERS.map((f) => (
          <Chip key={f} label={f} selected={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>
      <View style={styles.slots}>
        <TreeStage stage={0} scale={54 / 300} />
        <View style={styles.flex}>
          <AppText variant="callout14Bold" color="brandDeep">
            {`나무 ${TREES.length}/${MAX_TREE_SLOTS}그루 · ${empty}자리 남았어요`}
          </AppText>
          <AppText variant="caption12Medium" color="textBody">
            새로 심으면 홈 슬라이드에 나무가 추가돼요
          </AppText>
        </View>
      </View>
      <View style={styles.sectionHead}>
        <AppText variant="headline18Bold" color="textPrimary">
          내 조건에 맞는 취미
        </AppText>
        <AppText variant="caption12Bold" color="textMuted">
          맞춤도순
        </AppText>
      </View>
      {list.map((h) => (
        <ExploreRow key={h.id} item={h} />
      ))}
      {list.length === 0 ? (
        <AppText variant="callout14Regular" color="textMuted" align="center">
          조건에 맞는 취미가 없어요. 필터를 바꿔 보세요.
        </AppText>
      ) : null}
      <View style={styles.rowGap6}>
        <IconSlot name="info" size={14} color="textMuted" />
        <AppText variant="micro11Bold" color="textMuted" style={styles.flex}>
          온보딩 답변(예산·시간·가진 물건·장소)으로 맞춤도를 계산했어요
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12, paddingTop: 6 },
  rowGap6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  input: { flex: 1, padding: 0, color: COLORS.textPrimary, includeFontPadding: false },
  filterScroll: { marginHorizontal: -24 },
  filters: { gap: 8, paddingHorizontal: 24 },
  slots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: COLORS.bgKhaki,
  },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  loader: { paddingVertical: 16 },
  errorBox: { alignItems: 'center', gap: 10, paddingVertical: 12 },
  plant: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 8, paddingLeft: 10, paddingRight: 12, borderRadius: 999 },
});
