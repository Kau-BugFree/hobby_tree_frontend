/**
 * M-08 지역 직접 입력
 * - 검색 입력(TextInput + 지우기) → 결과 카드(RegionRow 목록, FlatList)
 * - 결과를 누르면 시·구 단위로 저장하고 M-03으로 돌아감 (동 단위는 ‘서울 마포구’처럼 구로 바뀜)
 * 로그인 상태: API-41 지역 검색(시·군·구, 0.3초 뒤 검색) → 누르면 API-42 활동 지역 설정(MANUAL · regionId)
 * 체험 모드: MOCK_DATA 검색
 */
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, IconSlot, KeyboardSafe, TopBar, Touchable, useToast } from '../../components';
import { errorMessage } from '../../api/client';
import { searchRegions as searchServerRegions, setLocation } from '../../api/endpoints';
import type { Region } from '../../api/types';
import { RegionResult, searchRegions } from '../../data/my';
import { useSession } from '../../lib/session';
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

/** 서버 지역 → 화면 행 */
const fromServer = (r: Region): RegionResult & { regionId: number } => ({
  label: r.fullName ?? r.name,
  saveAs: r.fullName ?? r.name,
  isDistrict: true,
  regionId: r.regionId,
});

export default function RegionScreen() {
  const insets = useSafeAreaInsets();
  const { state, update } = useAppState();
  const toast = useToast();
  const { signedIn } = useSession();
  const [q, setQ] = useState(signedIn ? '' : '마포');
  const [server, setServer] = useState<(RegionResult & { regionId: number })[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  // API-41 — 입력이 멈추고 0.3초 뒤 검색
  useEffect(() => {
    if (!signedIn) return;
    const keyword = q.trim();
    if (!keyword) {
      setServer([]);
      return;
    }
    let alive = true;
    const t = setTimeout(() => {
      searchServerRegions({ keyword: keyword.slice(0, 50), level: 'SIGUNGU', size: 30 })
        .then((res) => {
          if (!alive) return;
          setServer((res.items ?? []).map(fromServer));
          setSearchError(null);
        })
        .catch((e) => alive && setSearchError(errorMessage(e)));
    }, 300);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q, signedIn]);

  const results: RegionResult[] = signedIn ? server : searchRegions(q);

  const onPick = async (r: RegionResult) => {
    const regionId = (r as RegionResult & { regionId?: number }).regionId;
    let saved = r.saveAs;
    if (signedIn && regionId) {
      try {
        const res = await setLocation({ source: 'MANUAL', regionId });
        saved = res.location?.fullName ?? res.location?.name ?? saved;
      } catch (e) {
        toast({ title: '지역을 저장하지 못했어요', sub: errorMessage(e), icon: 'info' });
        return;
      }
    }
    update({ region: saved });
    back();
    toast({ title: `지역을 ‘${saved}’로 정했어요`, icon: 'pin' });
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
              {searchError ?? `‘${q}’로 찾은 지역이 없어요`}
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
