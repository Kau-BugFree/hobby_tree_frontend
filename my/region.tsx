/**
 * M-08 지역 직접 입력
 * - 검색 입력(TextInput + 지우기) → 결과 카드(RegionRow 목록, FlatList)
 * - 결과를 누르면 시·구 단위로 저장하고 M-03으로 돌아감 (동 단위는 ‘서울 마포구’처럼 구로 바뀜)
 * TODO(API): GET /regions?q= (행정구역 코드 포함) — 지금은 MOCK_DATA 검색
 */
import React, { useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconSlot, KeyboardSafe, TopBar, Touchable, useToast } from '../../components';
import { RegionResult, searchRegions } from '../../data/my';
import { useAppState } from '../../lib/appState';
import { back } from '../../lib/nav';
import { COLORS, TYPO } from '../../theme';

function RegionRow({ item, current, onPress }: { item: RegionResult; current: boolean; onPress: () => void }) {
  return (
    <Touchable
      accessibilityLabel={`${item.label}${item.isDistrict ? '' : `, 저장할 땐 ${item.saveAs}`}`}
      accessibilityState={{ selected: current }}
      onPress={onPress}
      style={[styles.row, current && styles.rowOn]}
    >
      <IconSlot name="pin" size={18} color={current ? 'brandPrimary' : 'textMuted'} />
      <View style={styles.flex}>
        <AppText variant="callout14Bold" color={current ? 'brandDeep' : 'textPrimary'}>
          {item.label}
        </AppText>
        <AppText variant="caption12Medium" color="textMuted">
          {item.isDistrict ? '구 전체 · 추천 기준으로 저장돼요' : `저장할 땐 ‘${item.saveAs}’로 바뀌어요`}
        </AppText>
      </View>
      {current ? <IconSlot name="check" size={18} color="brandPrimary" /> : null}
    </Touchable>
  );
}

export default function RegionScreen() {
  const insets = useSafeAreaInsets();
  const { state, update } = useAppState();
  const toast = useToast();
  const [q, setQ] = useState('마포');
  const results = searchRegions(q);

  const onPick = (r: RegionResult) => {
    update({ region: r.saveAs });
    back();
    toast({ title: `지역을 ‘${r.saveAs}’로 정했어요`, icon: 'pin' });
  };

  return (
    <KeyboardSafe style={[styles.root, { paddingTop: insets.top }]}>
      <TopBar title="지역 직접 입력" />
      <View style={styles.top}>
        <View style={styles.search}>
          <IconSlot name="search" size={18} color="textMuted" />
          <TextInput
            value={q}
            onChangeText={setQ}
            autoFocus
            placeholder="예: 마포구, 망원동"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
            accessibilityLabel="지역 검색"
            style={[TYPO.body16Regular, styles.input]}
          />
          {q ? (
            <Touchable small accessibilityLabel="검색어 지우기" onPress={() => setQ('')}>
              <IconSlot name="clear" size={18} color="textMuted" />
            </Touchable>
          ) : null}
        </View>
        <AppText variant="caption12Medium" color="textMuted">
          시·구·동 이름으로 찾아요. 저장은 시·구 단위로만 해요.
        </AppText>
      </View>
      <FlatList
        data={results}
        keyExtractor={(r) => r.label}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        renderItem={({ item }) => <RegionRow item={item} current={item.isDistrict && item.saveAs === state.region} onPress={() => onPick(item)} />}
        ListEmptyComponent={
          q ? (
            <AppText variant="callout14Regular" color="textMuted" align="center" style={styles.empty}>
              {`‘${q}’로 찾은 지역이 없어요`}
            </AppText>
          ) : undefined
        }
      />
    </KeyboardSafe>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: COLORS.bgApp },
  top: { gap: 8, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 },
  search: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1.5,
    borderColor: COLORS.brandPrimary,
  },
  input: { flex: 1, color: COLORS.textPrimary, padding: 0, includeFontPadding: false },
  list: { gap: 8, paddingHorizontal: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.bgSurface,
    borderWidth: 1,
    borderColor: COLORS.borderDefault,
  },
  rowOn: { backgroundColor: COLORS.bgGreenSoft, borderColor: COLORS.brandMid },
  empty: { paddingVertical: 24 },
});
