/**
 * 함께 · 근처 업체 찾기 (네이버 지역 업체 — 49개 목록 밖 신규 API)
 * - GET /local-businesses?region=&hobby= : 지역명 + 취미(요리교실·악기학원·독서모임)로 최대 5곳
 * - 업체를 고르면 POST /local-businesses/select → experienceId·sessionId 발급
 *   → 클래스 상세(API-36)로 이동, 예약 기록은 거기서 API-37
 * 로그인 상태에서만 쓸 수 있다 (토큰 필요)
 */
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, TextInput, View } from 'react-native';

import { ApiError, errorMessage } from '../../api/client';
import { searchLocalBusinesses, selectLocalBusiness } from '../../api/endpoints';
import type { LocalBusiness, LocalHobbyCode } from '../../api/types';
import { AppText, Button, IconSlot, Screen, TopBar, Touchable, useToast } from '../../components';
import { Chip } from '../../components/Chip';
import { SUPPORTED_HOBBIES } from '../../data/hobbies';
import { useAppState } from '../../lib/appState';
import { go } from '../../lib/nav';
import { useSession } from '../../lib/session';
import { COLORS, TYPO } from '../../theme';

const HOBBY_CODE: Record<string, LocalHobbyCode> = { 요리: 'COOKING', 악기: 'INSTRUMENT', 독서: 'READING' };
const KEYWORD: Record<LocalHobbyCode, string> = { COOKING: '요리교실', INSTRUMENT: '악기학원', READING: '독서모임' };

/** ‘서울 마포구’ → ‘마포구’ (네이버 검색 키워드로 그대로 쓰임) */
const regionWord = (r?: string) => (r ?? '').trim().split(/\s+/).pop() ?? '';

export default function NearbyScreen() {
  const { state } = useAppState();
  const { signedIn } = useSession();
  const toast = useToast();
  const [region, setRegion] = useState(regionWord(state.region));
  const [hobby, setHobby] = useState<string>(SUPPORTED_HOBBIES[0]);
  const [items, setItems] = useState<LocalBusiness[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);

  const code = HOBBY_CODE[hobby] ?? 'COOKING';
  const canSearch = signedIn && region.trim().length > 0 && region.trim().length <= 50;

  const search = async () => {
    if (!canSearch) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchLocalBusinesses(region.trim(), code);
      setItems(res.items ?? []);
    } catch (e) {
      setItems([]);
      setError(
        e instanceof ApiError && (e.code === 'LOCALBUSINESS502_1' || e.code === 'LOCALBUSINESS503_1')
          ? '지역 검색 서비스가 잠시 응답하지 않아요. 조금 뒤에 다시 시도해 주세요.'
          : errorMessage(e),
      );
    } finally {
      setLoading(false);
    }
  };

  // 취미를 바꾸면 바로 다시 찾는다
  useEffect(() => {
    if (items !== null) search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hobby]);

  const pick = async (b: LocalBusiness) => {
    const key = `${b.mapX}:${b.mapY}:${b.name}`;
    setPicking(key);
    try {
      const res = await selectLocalBusiness({ hobby: code, name: b.name, category: b.category, address: b.roadAddress || b.address, mapX: b.mapX, mapY: b.mapY });
      go(`/together/class/${res.experienceId}`);
    } catch (e) {
      const msg = e instanceof ApiError && e.code === 'LOCALBUSINESS503_2' ? '이 취미는 아직 예약 준비가 안 됐어요.' : errorMessage(e);
      toast({ title: '업체를 준비하지 못했어요', sub: msg, icon: 'info' });
    } finally {
      setPicking(null);
    }
  };

  return (
    <Screen header={<TopBar title="근처 업체 찾기" />} contentStyle={styles.content}>
      <AppText variant="callout14Regular" color="textBody">
        {`동네 이름과 취미로 근처 ${KEYWORD[code]}을(를) 찾아요. 고른 곳은 예약 기록으로 이어져요.`}
      </AppText>
      {!signedIn ? (
        <View style={styles.notice}>
          <IconSlot name="info" size={16} color="brandDeep" />
          <AppText variant="caption12Bold" color="brandDeep" style={styles.flex}>
            로그인하면 근처 업체를 찾을 수 있어요
          </AppText>
        </View>
      ) : null}
      <View style={styles.searchRow}>
        <IconSlot name="pin" size={18} color="textMuted" />
        <TextInput
          value={region}
          onChangeText={setRegion}
          maxLength={50}
          placeholder="예: 마포구, 강남구"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="search"
          onSubmitEditing={search}
          accessibilityLabel="지역 이름"
          style={[TYPO.callout14Regular, styles.input]}
        />
      </View>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {SUPPORTED_HOBBIES.map((h) => (
          <Chip key={h} label={h} selected={hobby === h} onPress={() => setHobby(h)} />
        ))}
      </View>
      <Button label={loading ? '찾는 중…' : `${region.trim() || '동네'} ${KEYWORD[code]} 찾기`} disabled={!canSearch || loading} onPress={search} />

      {loading ? <ActivityIndicator color={COLORS.brandPrimary} /> : null}
      {error ? (
        <AppText variant="callout14Regular" color="textBody">
          {error}
        </AppText>
      ) : null}
      {items && !loading && !error && items.length === 0 ? (
        <AppText variant="callout14Regular" color="textMuted" align="center" style={styles.empty}>
          근처에서 찾지 못했어요. 이웃 동네 이름으로 다시 찾아보세요.
        </AppText>
      ) : null}
      {(items ?? []).map((b) => {
        const key = `${b.mapX}:${b.mapY}:${b.name}`;
        return (
          <Touchable key={key} accessibilityLabel={`${b.name} 선택`} disabled={!!picking} onPress={() => pick(b)} style={styles.card}>
            <View style={styles.flex}>
              <AppText variant="callout14Bold" color="textPrimary">
                {b.name}
              </AppText>
              {b.category ? (
                <AppText variant="caption12Bold" color="brandPrimary">
                  {b.category}
                </AppText>
              ) : null}
              <AppText variant="caption12Medium" color="textMuted">
                {b.roadAddress || b.address || '주소 정보 없음'}
              </AppText>
              {b.telephone ? (
                <Touchable small accessibilityLabel={`${b.name} 전화 걸기`} onPress={() => Linking.openURL(`tel:${b.telephone}`).catch(() => undefined)}>
                  <AppText variant="caption12Bold" color="textBody">{`☎ ${b.telephone}`}</AppText>
                </Touchable>
              ) : null}
            </View>
            {picking === key ? <ActivityIndicator color={COLORS.brandPrimary} /> : <IconSlot name="chev" size={18} color="textMuted" />}
          </Touchable>
        );
      })}
      {items?.length ? (
        <AppText variant="caption12Medium" color="textMuted">
          검색 결과는 네이버 지역 검색에서 가져와요. 정보는 업체 사정에 따라 다를 수 있어요.
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: 2 },
  content: { gap: 12 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 14, backgroundColor: COLORS.bgGreenSoft },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 14, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
  input: { flex: 1, paddingVertical: 12, color: COLORS.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { paddingVertical: 20 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, backgroundColor: COLORS.bgSurface, borderWidth: 1, borderColor: COLORS.borderDefault },
});
