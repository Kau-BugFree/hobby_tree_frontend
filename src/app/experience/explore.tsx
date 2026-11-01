/**
 * E-04 다른 취미 둘러보기
 * - 검색창(TextInput) + 필터 칩 가로 스크롤 + 남은 자리 + 맞춤 취미 목록(ExploreRow)
 * - ‘심기’ → H-09 새 나무 심기 (Figma는 O-06-1로 연결돼 있으나, 온보딩 이후에는 H-09 흐름이 맞아 변경)
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

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

export default function ExploreScreen() {
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
  plant: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 8, paddingLeft: 10, paddingRight: 12, borderRadius: 999 },
});
